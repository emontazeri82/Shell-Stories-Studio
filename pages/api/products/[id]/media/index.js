// pages/api/admin/products/[id]/media/index.js
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { createAdminHandler } from "@/lib/middleware/createAdminHandler";
import { sendErrorResponse, sendSuccessResponse } from "@/lib/api";
import { getRedisClient } from "@/lib/redis";
import { safeRedisKey } from "@/lib/redis/formatkey";

// ---------- DB ----------
const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// ---------- Debug ----------
const DEBUG = process.env.DEBUG_MEDIA === "1";
const t0 = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const took = (s) =>
  `${Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - s)}ms`;
const head = (v, n = 180) => {
  try {
    if (typeof v === "string") return v.slice(0, n).replace(/\n/g, "⏎");
    return JSON.stringify(v)?.slice(0, n);
  } catch {
    return String(v).slice(0, n);
  }
};
const dbg = (...a) => DEBUG && console.log(...a);

// ---------- helpers ----------
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const clampLen = (s, n) => (typeof s === "string" ? s.slice(0, n) : s);
const KIND_SET = new Set(["image", "video"]);
const isHTTPSUrl = (s) => {
  try {
    const u = new URL(String(s));
    return u.protocol === "https:";
  } catch {
    return false;
  }
};

async function invalidateProductsCache() {
  const start = t0();
  try {
    const redis = await getRedisClient();
    const pattern = `${safeRedisKey(["products"])}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
    dbg(`[media] cache invalidated ${keys.length} keys in ${took(start)}`);
  } catch (e) {
    console.warn("⚠️ Redis cache invalidation skipped:", e?.message || e);
  }
}

// Admin-protected handler (auth + rate limit inside, returns JSON on 401)
const handler = createAdminHandler({ rateLimit: { limit: 60, window: 60 } });

// ========== GET /api/admin/products/:id/media  -> { items: [...] } ==========
handler.get(async (req, res) => {
  const start = t0();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const productId = Number(req.query.id);
  if (!isPosInt(productId)) {
    return sendErrorResponse(res, 400, "Invalid product id");
  }

  try {
    const db = await openDB();
    const rows = await db.all(
      `SELECT id, product_id, kind, public_id, secure_url, format,
              width, height, duration, sort_order, is_primary, created_at
         FROM product_media
        WHERE product_id = ?
        ORDER BY is_primary DESC, sort_order ASC, id ASC`,
      productId
    );

    const items = rows.map((m) => ({
      id: m.id,
      product_id: m.product_id,
      kind: m.kind,
      public_id: m.public_id,
      secure_url: m.secure_url,
      format: m.format,
      width: m.width != null ? Number(m.width) : null,
      height: m.height != null ? Number(m.height) : null,
      duration: m.duration != null ? Number(m.duration) : null,
      sort_order: m.sort_order != null ? Number(m.sort_order) : 0,
      is_primary: Number(m.is_primary) === 1,
      created_at: m.created_at,
    }));

    dbg(`[media][GET] pid=${productId} rows=${rows.length} first=${head(items[0])} in ${took(start)}`);
    return sendSuccessResponse(res, 200, "OK", { items });
  } catch (err) {
    console.error("❌ Load media failed:", err);
    return sendErrorResponse(res, 500, "Failed to load media");
  }
});

// ========== POST /api/admin/products/:id/media ==========
/**
 * Body:
 * {
 *   public_id, secure_url, kind('image'|'video'),
 *   format?, width?, height?, duration?, sort_order?, is_primary?
 * }
 */
handler.post(async (req, res) => {
  const start = t0();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const productId = Number(req.query.id);
  if (!isPosInt(productId)) {
    return sendErrorResponse(res, 400, "Invalid product id");
  }

  const {
    public_id,
    secure_url,
    kind,
    format = null,
    width = null,
    height = null,
    duration = null,
    sort_order,
    is_primary = 0,
  } = req.body || {};

  // sanitize inputs
  const k = String(kind || "").toLowerCase();
  const pubId = clampLen(public_id, 255);
  const url = clampLen(secure_url, 2048);
  const fmt = format ? clampLen(String(format), 32) : null;
  const w = width != null ? Number(width) : null;
  const h = height != null ? Number(height) : null;
  const d = duration != null ? Number(duration) : null;
  const makePrimary = Number(is_primary) === 1 || is_primary === true;

  if (!pubId || !url || !KIND_SET.has(k)) {
    return sendErrorResponse(
      res,
      400,
      "public_id, secure_url and kind ('image'|'video') are required"
    );
  }
  if (!isHTTPSUrl(url)) {
    return sendErrorResponse(res, 400, "secure_url must be a valid https URL");
  }
  if (w != null && (!Number.isFinite(w) || w < 0)) {
    return sendErrorResponse(res, 400, "width must be a non-negative number");
  }
  if (h != null && (!Number.isFinite(h) || h < 0)) {
    return sendErrorResponse(res, 400, "height must be a non-negative number");
  }
  if (d != null && (!Number.isFinite(d) || d < 0)) {
    return sendErrorResponse(res, 400, "duration must be a non-negative number");
  }

  let db;
  try {
    db = await openDB();
    await db.exec("BEGIN");

    // ensure product exists
    const p = await db.get(`SELECT id FROM products WHERE id = ?`, productId);
    if (!p) {
      await db.exec("ROLLBACK");
      return sendErrorResponse(res, 404, "Product not found");
    }

    // determine sort order (append if not provided)
    let order = Number.isFinite(Number(sort_order)) ? Number(sort_order) : NaN;
    if (!Number.isFinite(order) || order < 0) {
      const max = await db.get(
        `SELECT COALESCE(MAX(sort_order), -1) AS max_order
           FROM product_media
          WHERE product_id = ?`,
        productId
      );
      order = Number(max?.max_order ?? -1) + 1;
    }

    if (makePrimary) {
      await db.run(`UPDATE product_media SET is_primary = 0 WHERE product_id = ?`, productId);
    }

    const result = await db.run(
      `INSERT INTO product_media
         (product_id, kind, public_id, secure_url, format, width, height, duration, sort_order, is_primary)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      productId,
      k,
      pubId,
      url,
      fmt,
      w != null ? w : null,
      h != null ? h : null,
      d != null ? d : null,
      order,
      makePrimary ? 1 : 0
    );

    await db.exec("COMMIT");
    await invalidateProductsCache();

    dbg(
      `[media][POST] pid=${productId} id=${result.lastID} primary=${makePrimary} sort=${order} in ${took(
        start
      )}`
    );
    return sendSuccessResponse(res, 201, "Media created", { id: result.lastID });
  } catch (err) {
    try {
      if (db) await db.exec("ROLLBACK");
    } catch {}
    console.error("❌ Create media failed:", err);
    return sendErrorResponse(res, 500, "Failed to create media");
  }
});

export default handler;





