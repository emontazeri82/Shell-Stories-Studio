import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { createAdminHandler } from "@/lib/middleware/createAdminHandler";
import { sendErrorResponse, sendSuccessResponse } from "@/lib/api";
import { getRedisClient } from "@/lib/redis";
import { safeRedisKey } from "@/lib/redis/formatkey";

// ──────────────────────────────
// DB setup
// ──────────────────────────────
const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// ──────────────────────────────
// Debug + helpers
// ──────────────────────────────
const DEBUG = process.env.DEBUG_MEDIA === "1";
const t0 = () => (typeof performance !== "undefined" ? performance.now() : Date.now());
const took = (s) =>
  `${Math.round((typeof performance !== "undefined" ? performance.now() : Date.now()) - s)}ms`;
const dbg = (...a) => DEBUG && console.log(...a);

async function invalidateProductsCache() {
  try {
    const redis = await getRedisClient();
    const pattern = `${safeRedisKey(["products"])}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
    dbg(`[create_with_media] cache invalidated ${keys.length} keys`);
  } catch (e) {
    console.warn("⚠️ Redis cache invalidation skipped:", e?.message || e);
  }
}

const isHTTPSUrl = (s) => {
  try {
    const u = new URL(String(s));
    return u.protocol === "https:";
  } catch {
    return false;
  }
};
const KIND_SET = new Set(["image", "video"]);

// ──────────────────────────────
// Main handler
// ──────────────────────────────
const handler = createAdminHandler({
  rateLimit: { limit: 60, window: 60 }, // same as other admin endpoints
});

handler.post(async (req, res) => {
  const start = t0();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const {
    name,
    description,
    price,
    stock,
    category,
    is_active = 1,
    image_url = null,
    media = [],
  } = req.body || {};

  if (!name || typeof price !== "number") {
    return sendErrorResponse(res, 400, "Missing required fields: name and numeric price");
  }

  const db = await openDB();
  try {
    await db.exec("BEGIN");

    // 1️⃣ Insert product
    const result = await db.run(
      `INSERT INTO products
        (name, description, price, stock, category, image_url, is_active)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        name,
        description || null,
        price,
        Number.isInteger(stock) ? stock : 0,
        category || "decor",
        image_url || (media[0]?.secure_url ?? media[0]?.url ?? null),
        is_active ? 1 : 0,
      ]
    );

    const productId = result.lastID;
    dbg(`🪄 Inserted product id=${productId}`);

    // 2️⃣ Insert media rows
    for (const [idx, m] of (Array.isArray(media) ? media : []).entries()) {
      const kind = String(m.kind || m.resourceType || m.resource_type || "").toLowerCase();
      const url = m.secure_url || m.url;
      const publicId = m.public_id || m.publicId;

      if (!KIND_SET.has(kind) || !isHTTPSUrl(url) || !publicId) {
        console.warn("⚠️ Skipping invalid media entry:", m);
        continue;
      }

      await db.run(
        `INSERT INTO product_media
           (product_id, kind, public_id, secure_url, format, width, height, duration, sort_order, is_primary)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          productId,
          kind,
          publicId,
          url,
          m.format || null,
          m.width || null,
          m.height || null,
          m.duration || null,
          idx,
          idx === 0 ? 1 : 0,
        ]
      );
    }

    await db.exec("COMMIT");
    await invalidateProductsCache();

    dbg(`[create_with_media] ✅ done in ${took(start)}`);
    return sendSuccessResponse(res, 201, "Product and media created", {
      productId,
    });
  } catch (err) {
    try {
      await db.exec("ROLLBACK");
    } catch {}
    console.error("❌ create_with_media failed:", err);
    return sendErrorResponse(res, 500, "Database transaction failed");
  }
});

export default handler;
