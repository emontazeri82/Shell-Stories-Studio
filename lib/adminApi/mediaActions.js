import axios from "axios";

// ---------------------------------------------------------------------------
// Tunables / Prefixes
// ---------------------------------------------------------------------------

// Public (read) API prefix for product media
const MEDIA_API_PREFIX =
  process.env.NEXT_PUBLIC_MEDIA_API_PREFIX || "/api/products";

// Where the admin batch save endpoint is mounted
const ADMIN_MEDIA_SAVE_PATH =
  process.env.NEXT_PUBLIC_ADMIN_MEDIA_SAVE_PATH || "/api/admin/media/save";

// Mutations (PATCH/DELETE) default to the same prefix as reads
const MEDIA_MUTATIONS_PREFIX =
  process.env.NEXT_PUBLIC_MEDIA_MUTATIONS_PREFIX || MEDIA_API_PREFIX;

// Default timeout & retry
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY = { attempts: 1, baseDelayMs: 400 };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

function assertPositiveId(name, value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return num;
}

function buildURL(path, params) {
  const qs = new URLSearchParams();
  if (params && typeof params === "object") {
    for (const [k, v] of Object.entries(params)) {
      if (v !== undefined && v !== null && String(v).length > 0) {
        qs.set(k, String(v));
      }
    }
  }
  const q = qs.toString();
  return q ? `${path}?${q}` : path;
}

function readCSRFFromDOM() {
  if (typeof document === "undefined") return null;
  const meta =
    document.querySelector('meta[name="csrf-token"]') ||
    document.querySelector('meta[name="next-csrf"]');
  return meta?.getAttribute("content") || null;
}

function sleep(ms) {
  const jitter = Math.floor(Math.random() * Math.min(50, ms / 4));
  return new Promise((r) => setTimeout(r, ms + jitter));
}

// ---------------------------------------------------------------------------
// Hardened JSON request (Axios version)
// ---------------------------------------------------------------------------

async function safeAxiosJSON(
  url,
  {
    method = "GET",
    headers = {},
    jsonBody,
    formBody,
    timeoutMs = DEFAULT_TIMEOUT_MS,
    retry = DEFAULT_RETRY,
  } = {}
) {
  const csrf = readCSRFFromDOM();
  const finalHeaders = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(csrf ? { "X-CSRF-Token": csrf } : {}),
    ...headers,
  };

  let data;
  if (jsonBody !== undefined) {
    data = jsonBody;
    finalHeaders["Content-Type"] = "application/json";
  } else if (formBody instanceof FormData) {
    data = formBody;
  }

  let attempt = 0;
  while (true) {
    try {
      console.log("[Axios] Calling:", url);
      const res = await axios({
        url,
        method,
        headers: finalHeaders,
        data,
        timeout: timeoutMs,
        withCredentials: true,
      });
      return res.data;
    } catch (err) {
      attempt++;
      console.error("[Axios] Error at:", url, err);

      if (axios.isCancel(err)) {
        throw new Error(`Request aborted: ${url}`);
      }

      const status = err?.response?.status;
      const dataText = JSON.stringify(err?.response?.data || {});
      if (status === 401 || status === 403) {
        throw new Error(
          `Authorization failed (${status}). ${dataText || "Unauthorized"}`
        );
      }

      // Retry transient network/server errors
      if (status === 429 || status === 503) {
        if (attempt <= (retry?.attempts ?? 1)) {
          const delay = (retry?.baseDelayMs ?? 400) * attempt;
          console.warn(`[Axios] Retrying ${url} in ${delay}ms (attempt ${attempt})`);
          await sleep(delay);
          continue;
        }
        throw new Error(`Transient error ${status} after ${attempt} retries`);
      }

      if (status && err.response?.data) {
        const msg =
          err.response.data.error ||
          err.response.data.message ||
          `HTTP ${status}`;
        throw new Error(msg);
      }

      if (err.code === "ECONNABORTED") {
        throw new Error(`Request timeout after ${timeoutMs}ms for ${url}`);
      }

      throw new Error(`Network or unknown error calling ${url}`);
    }
  }
}

// ---------------------------------------------------------------------------
// PUBLIC READS
// ---------------------------------------------------------------------------

/**
 * Fetch media for a specific product
 * @param {number} productId
 * @returns {Promise<Array>} array of media items (images/videos)
 */
export async function fetchProductMedia(productId) {
  const pid = assertPositiveId("productId", productId);
  const url = buildURL(`${MEDIA_API_PREFIX}/${pid}/media`);
  const data = await safeAxiosJSON(url, { method: "GET" });

  // Handle both shapes: { items: [...] } or { media: [...] }
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.media)) return data.media;
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
// ADMIN WRITES
// ---------------------------------------------------------------------------

/**
 * Save many media items after Cloudinary uploads
 * @param {number} productId
 * @param {Array} mediaItems
 */
export async function saveMediaBatch(productId, mediaItems) {
  const pid = assertPositiveId("productId", productId);
  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    throw new Error("saveMediaBatch requires a non-empty media array");
  }

  const url = buildURL(ADMIN_MEDIA_SAVE_PATH, { productId: String(pid) });
  return await safeAxiosJSON(url, {
    method: "POST",
    jsonBody: { media: mediaItems },
    retry: { attempts: 2, baseDelayMs: 500 },
  });
}

// ---------------------------------------------------------------------------
// MUTATIONS
// ---------------------------------------------------------------------------

/**
 * Delete a specific media row
 * @param {number} productId
 * @param {number} mediaId
 */
export async function deleteMedia(productId, mediaId) {
  const pid = assertPositiveId("productId", productId);
  const mid = assertPositiveId("mediaId", mediaId);
  const url = buildURL(`${MEDIA_MUTATIONS_PREFIX}/${pid}/media/${mid}`);
  await safeAxiosJSON(url, { method: "DELETE" });
  return true;
}

/**
 * Update an existing media row (sort_order, is_primary)
 * @param {number} productId
 * @param {number} mediaId
 * @param {Object} patch
 */
export async function updateMedia(productId, mediaId, patch) {
  const pid = assertPositiveId("productId", productId);
  const mid = assertPositiveId("mediaId", mediaId);

  const body = {};
  if (patch && typeof patch === "object") {
    if (typeof patch.sort_order !== "undefined") {
      const n = Number(patch.sort_order);
      if (!Number.isInteger(n) || n < 0) {
        throw new Error("sort_order must be a non-negative integer");
      }
      body.sort_order = n;
    }
    if (typeof patch.is_primary !== "undefined") {
      body.is_primary = !!Number(patch.is_primary);
    }
  }

  const url = buildURL(`${MEDIA_MUTATIONS_PREFIX}/${pid}/media/${mid}`);
  return await safeAxiosJSON(url, {
    method: "PATCH",
    jsonBody: body,
  });
}



  