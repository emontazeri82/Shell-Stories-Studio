// lib/adminApi/mediaActions.js

// ---------------------------------------------------------------------------
// Tunables / Prefixes
// ---------------------------------------------------------------------------

/**
 * Public (read) API prefix for product media.
 * Your existing read route lives at:  GET /api/products/:id/media
 */
const MEDIA_API_PREFIX =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_MEDIA_API_PREFIX) ||
  "/api/products";

/**
 * Where the admin batch save endpoint is mounted.
 * We created: POST /api/admin/media/save?productId=123
 */
const ADMIN_MEDIA_SAVE_PATH =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_ADMIN_MEDIA_SAVE_PATH) ||
  "/api/admin/media/save";

/**
 * Mutations (PATCH/DELETE) default to the same prefix as reads.
 * If you later add admin-only mutation routes (e.g., /api/admin/products/:id/media/:mid),
 * set NEXT_PUBLIC_MEDIA_MUTATIONS_PREFIX=/api/admin/products
 */
const MEDIA_MUTATIONS_PREFIX =
  (typeof process !== "undefined" &&
    process.env &&
    process.env.NEXT_PUBLIC_MEDIA_MUTATIONS_PREFIX) ||
  MEDIA_API_PREFIX;

/** Default request timeout & retries for JSON APIs (not used for file uploads). */
const DEFAULT_TIMEOUT_MS = 15_000;
const DEFAULT_RETRY = { attempts: 1, baseDelayMs: 400 };

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

/** @throws Error if value is not a positive integer. */
function assertPositiveId(name, value) {
  const num = Number(value);
  if (!Number.isInteger(num) || num <= 0) {
    throw new Error(`${name} must be a positive integer`);
  }
  return num;
}

/** Build a URL with query params (works with relative or absolute paths). */
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

/** Read CSRF token if you expose one via <meta>. Safe no-op if absent. */
function readCSRFFromDOM() {
  if (typeof document === "undefined") return null;
  const meta =
    document.querySelector('meta[name="csrf-token"]') ||
    document.querySelector('meta[name="next-csrf"]');
  return meta?.getAttribute("content") || null;
}

/** Sleep helper used for retry backoff (with tiny jitter). */
function sleep(ms) {
  const jitter = Math.floor(Math.random() * Math.min(50, ms / 4));
  return new Promise((r) => setTimeout(r, ms + jitter));
}

// ---------------------------------------------------------------------------
// Hardened JSON fetch
// ---------------------------------------------------------------------------

/**
 * Fetch JSON with:
 *  - Accept + X-Requested-With headers
 *  - Optional JSON / FormData body
 *  - Timeout
 *  - Retry on 429/503 with backoff
 *  - Clear messages for auth failures & non-JSON responses
 *
 * @returns Parsed JSON (not the Response)
 * @throws Error with a helpful message
 */
async function safeFetchJSON(
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
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  const csrf = readCSRFFromDOM();
  const baseHeaders = {
    Accept: "application/json",
    "X-Requested-With": "XMLHttpRequest",
    ...(csrf ? { "X-CSRF-Token": csrf } : {}),
  };
  const h = new Headers({ ...baseHeaders, ...headers });

  let body;
  if (jsonBody !== undefined) {
    h.set("Content-Type", "application/json");
    body = JSON.stringify(jsonBody);
  } else if (formBody instanceof FormData) {
    body = formBody; // Browser sets correct multipart boundary automatically
  }

  const doFetch = async () => {
    const res = await fetch(url, {
      method,
      headers: h,
      body,
      credentials: "same-origin", // cookies for relative URLs
      signal: controller.signal,
    });

    // 204 No Content
    if (res.status === 204) return null;

    const ct = res.headers.get("Content-Type") || "";
    const isJSON =
      ct.toLowerCase().includes("application/json") ||
      ct.toLowerCase().startsWith("application/problem+json");
    const text = await res.text().catch(() => "");

    // Clear auth errors
    if (res.status === 401 || res.status === 403) {
      let details;
      if (isJSON) {
        try {
          details = JSON.parse(text);
        } catch {}
      }
      const head = text.slice(0, 200);
      const reason =
        details?.error ||
        details?.message ||
        (head.startsWith("<!DOCTYPE html")
          ? "Received HTML (likely an auth page)"
          : head || "Unauthorized");
      throw new Error(`Authorization failed (${res.status}). ${reason}`);
    }

    // Retry candidates
    if (res.status === 429 || res.status === 503) {
      const err = new Error(`Transient error ${res.status}`);
      err.transient = true;
      err.status = res.status;
      throw err;
    }

    // Other non-OK -> derive best message
    if (!res.ok) {
      if (isJSON) {
        try {
          const j = JSON.parse(text);
          const msg = j?.error || j?.message || `HTTP ${res.status}`;
          throw new Error(msg);
        } catch {
          throw new Error(`Invalid JSON error body (HTTP ${res.status})`);
        }
      }
      throw new Error(
        `Non-JSON error (HTTP ${res.status}) from ${url}: ${text.slice(0, 200)}`
      );
    }

    // OK path must be JSON for our UI
    if (!isJSON) {
      throw new Error(
        `Non-JSON success from ${url}. Content-Type: ${ct}. Head: ${text.slice(
          0,
          180
        )}`
      );
    }

    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON from ${url}: ${e.message || "parse failed"}`);
    }
  };

  try {
    let attempt = 0;
    while (true) {
      try {
        const out = await doFetch();
        return out;
      } catch (e) {
        attempt += 1;
        if (e?.name === "AbortError") {
          throw new Error(`Request timeout after ${timeoutMs}ms for ${url}`);
        }
        if (e?.transient && attempt <= (retry?.attempts ?? 1)) {
          const delay = (retry?.baseDelayMs ?? 400) * attempt;
          await sleep(delay);
          continue;
        }
        throw e;
      }
    }
  } finally {
    clearTimeout(timer);
  }
}

// ---------------------------------------------------------------------------
/** PUBLIC READS — keep your current routes */
// GET /api/products/:id/media
// ---------------------------------------------------------------------------

/**
 * Fetch media rows for a product (storefront or admin UI).
 * Returns [] if none or on shape mismatch.
 */
export async function fetchProductMedia(productId) {
  const pid = assertPositiveId("productId", productId);
  const url = buildURL(`${MEDIA_API_PREFIX}/${pid}/media`);
  const data = await safeFetchJSON(url, { method: "GET" });

  // Tolerate both { items: [...] } and { media: [...] } shapes.
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.media)) return data.media;
  return Array.isArray(data) ? data : [];
}

// ---------------------------------------------------------------------------
/** ADMIN WRITES — direct-to-Cloudinary + batch save (no /api/admin/upload) */
// POST /api/admin/media/save?productId=123
// ---------------------------------------------------------------------------

/**
 * Save many media rows after direct Cloudinary uploads.
 * Expects items with the new shape:
 * { url, publicId, resourceType, format, bytes, width, height, duration, originalFilename, folder, sort_order }
 */
export async function saveMediaBatch(productId, mediaItems) {
  const pid = assertPositiveId("productId", productId);
  if (!Array.isArray(mediaItems) || mediaItems.length === 0) {
    throw new Error("saveMediaBatch requires a non-empty media array");
    }
  const url = buildURL(ADMIN_MEDIA_SAVE_PATH, { productId: String(pid) });
  return await safeFetchJSON(url, {
    method: "POST",
    jsonBody: { media: mediaItems },
    retry: { attempts: 2, baseDelayMs: 500 },
  });
}

// ---------------------------------------------------------------------------
// LEGACY/DEPRECATED helpers removed or redirected
// ---------------------------------------------------------------------------

/**
 * DEPRECATED — do not use. The server-side /api/admin/upload has been removed.
 * Use directCloudinaryUpload (client) + saveMediaBatch (server) instead.
 */
export async function uploadAssetToCloudinary() {
  throw new Error(
    "uploadAssetToCloudinary is deprecated. Use directCloudinaryUpload (client) + saveMediaBatch (server)."
  );
}

/**
 * DEPRECATED single-row attach helper (legacy payload).
 * You can keep this if you still POST one-by-one to /api/products/:id/media elsewhere,
 * but the recommended path is saveMediaBatch().
 */
export async function attachMedia(productId, payload) {
  const pid = assertPositiveId("productId", productId);

  const allowed = [
    "public_id",
    "secure_url",
    "kind",
    "format",
    "width",
    "height",
    "duration",
    "sort_order",
    "is_primary",
  ];
  const body = {};
  for (const k of allowed) {
    if (k in payload) body[k] = payload[k];
  }

  if (!body.public_id || !body.secure_url || !body.kind) {
    throw new Error(
      "attachMedia payload requires public_id, secure_url, and kind"
    );
  }

  if (typeof body.is_primary !== "undefined") {
    body.is_primary = !!Number(body.is_primary);
  }

  const url = buildURL(`${MEDIA_API_PREFIX}/${pid}/media`);
  return await safeFetchJSON(url, {
    method: "POST",
    jsonBody: body,
  });
}

// ---------------------------------------------------------------------------
// Mutations (delete / patch). By default use public prefix; can override via env.
// ---------------------------------------------------------------------------

/** Delete a media row. */
export async function deleteMedia(productId, mediaId) {
  const pid = assertPositiveId("productId", productId);
  const mid = assertPositiveId("mediaId", mediaId);

  const prefix = MEDIA_MUTATIONS_PREFIX; // e.g., "/api/products" or "/api/admin/products"
  const url = buildURL(`${prefix}/${pid}/media/${mid}`);
  await safeFetchJSON(url, { method: "DELETE" });
  return true;
}

/**
 * Patch media row fields (currently supports sort_order and is_primary).
 * Returns the server payload (often { success, media }).
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

  const prefix = MEDIA_MUTATIONS_PREFIX; // e.g., "/api/products" or "/api/admin/products"
  const url = buildURL(`${prefix}/${pid}/media/${mid}`);
  return await safeFetchJSON(url, {
    method: "PATCH",
    jsonBody: body,
  });
}




  