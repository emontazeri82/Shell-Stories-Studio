// pages/api/admin/products/[id]/media/[mediaId].js
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import { v2 as cloudinary } from "cloudinary";

import { createAdminHandler } from "@/lib/middleware/createAdminHandler";
import { sendErrorResponse, sendSuccessResponse } from "@/lib/api";
import { getRedisClient } from "@/lib/redis";
import { safeRedisKey } from "@/lib/redis/formatkey";

// ---------- DB ----------
const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// ---------- Cloudinary (envs must be set in .env.local) ----------
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

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

async function invalidateProductsCache() {
  try {
    const redis = await getRedisClient();
    const pattern = `${safeRedisKey(["products"])}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
    dbg(`[media] cache invalidated ${keys.length} keys`);
  } catch (e) {
    console.warn("⚠️ Redis cache invalidation skipped:", e?.message || e);
  }
}

// Admin auth + rate limit baked in (returns JSON on 401)
const handler = createAdminHandler({ rateLimit: { limit: 60, window: 60 } });

// ======================= PATCH =======================
// PATCH /api/admin/products/:id/media/:mediaId
// Body: { sort_order?: number, is_primary?: 0|1|true|false }
handler.patch(async (req, res) => {
  const start = t0();
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");

  const productId = Number(req.query.id);
  const mediaId = Number(req.query.mediaId);

  if (!isPosInt(productId)) return sendErrorResponse(res, 400, "Invalid product id");
  if (!isPosInt(mediaId))   return sendErrorResponse(res, 400, "Invalid media id");

  const { sort_order, is_primary } = req.body || {};
  const patch = {};

  if (sort_order !== undefined) {
    const so = Number(sort_order);
    if (!Number.isFinite(so) || so < 0) {
      return sendErrorResponse(res, 400, "sort_order must be a non-negative number");
    }
    patch.sort_order = so;
  }

  if (is_primary !== undefined) {
    patch.is_primary = Number(is_primary) === 1 || is_primary === true ? 1 : 0;
  }

  if (!Object.keys(patch).length) {
    return sendErrorResponse(res, 400, "No valid fields to update");
  }

  let db;
  try {
    db = await openDB();
    await db.exec("BEGIN");

    // Ensure the media row exists and belongs to product
    const existing = await db.get(
      `SELECT id, product_id, sort_order, is_primary
         FROM product_media
        WHERE id = ? AND product_id = ?`,
      mediaId,
      productId
    );
    if (!existing) {
      await db.exec("ROLLBACK");
      return sendErrorResponse(res, 404, "Media not found");
    }

    // If making this primary → clear others first
    if (patch.is_primary === 1) {
      await db.run(`UPDATE product_media SET is_primary = 0 WHERE product_id = ?`, productId);
    }

    // If changing sort order, swap with any conflicting row
    if (patch.sort_order !== undefined) {
      const conflict = await db.get(
        `SELECT id, sort_order FROM product_media
          WHERE product_id = ? AND sort_order = ? AND id != ?`,
        productId,
        patch.sort_order,
        mediaId
      );
      if (conflict) {
        // move conflicting row into current row's old slot (default to 0)
        const oldOrder = existing.sort_order ?? 0;
        await db.run(
          `UPDATE product_media SET sort_order = ?
             WHERE id = ? AND product_id = ?`,
          oldOrder,
          conflict.id,
          productId
        );
      }
    }

    // Build dynamic update
    const fields = [];
    const values = [];
    if (patch.sort_order !== undefined) {
      fields.push("sort_order = ?");
      values.push(patch.sort_order);
    }
    if (patch.is_primary !== undefined) {
      fields.push("is_primary = ?");
      values.push(patch.is_primary);
    }
    values.push(mediaId, productId);

    await db.run(
      `UPDATE product_media SET ${fields.join(", ")} WHERE id = ? AND product_id = ?`,
      values
    );

    await db.exec("COMMIT");

    // Return fresh row
    const updated = await db.get(
      `SELECT id, product_id, kind, public_id, secure_url, format,
              width, height, duration, sort_order, is_primary, created_at
         FROM product_media
        WHERE id = ? AND product_id = ?`,
      mediaId,
      productId
    );

    await invalidateProductsCache();

    dbg(`[media][PATCH] pid=${productId} mid=${mediaId} body~ ${head(req.body)} in ${took(start)}`);
    return sendSuccessResponse(res, 200, "Media updated", {
      media: {
        ...updated,
        width:    updated.width    != null ? Number(updated.width)    : null,
        height:   updated.height   != null ? Number(updated.height)   : null,
        duration: updated.duration != null ? Number(updated.duration) : null,
        sort_order: Number(updated.sort_order ?? 0),
        is_primary: Number(updated.is_primary) === 1,
      },
    });
  } catch (err) {
    try { if (db) await db.exec("ROLLBACK"); } catch {}
    console.error("❌ Media update failed:", err);
    return sendErrorResponse(res, 500, "Failed to update media");
  }
});

// ======================= DELETE =======================
// DELETE /api/admin/products/:id/media/:mediaId
handler.delete(async (req, res) => {
  const start = t0();
  const productId = Number(req.query.id);
  const mediaId = Number(req.query.mediaId);

  if (!isPosInt(productId)) return sendErrorResponse(res, 400, "Invalid product id");
  if (!isPosInt(mediaId))   return sendErrorResponse(res, 400, "Invalid media id");

  let db;
  try {
    db = await openDB();
    await db.exec("BEGIN");

    // Load the row to know public_id/kind/primary
    const media = await db.get(
      `SELECT id, product_id, public_id, kind, is_primary
         FROM product_media
        WHERE id = ? AND product_id = ?`,
      mediaId,
      productId
    );
    if (!media) {
      await db.exec("ROLLBACK");
      return sendErrorResponse(res, 404, "Media not found");
    }

    // Best-effort: delete from Cloudinary
    if (media.public_id) {
      try {
        await cloudinary.uploader.destroy(media.public_id, {
          resource_type: media.kind === "video" ? "video" : "image",
        });
      } catch (e) {
        console.warn("⚠️ Cloudinary destroy warning:", e?.message || e);
      }
    }

    // Delete DB row
    await db.run(`DELETE FROM product_media WHERE id = ? AND product_id = ?`, mediaId, productId);

    // If deleted the primary → promote the next best
    if (Number(media.is_primary) === 1) {
      const next = await db.get(
        `SELECT id
           FROM product_media
          WHERE product_id = ?
          ORDER BY is_primary DESC, sort_order ASC, id ASC
          LIMIT 1`,
        productId
      );
      if (next) {
        await db.run(
          `UPDATE product_media SET is_primary = 1 WHERE id = ? AND product_id = ?`,
          next.id,
          productId
        );
      }
    }

    await db.exec("COMMIT");
    await invalidateProductsCache();

    dbg(`[media][DELETE] pid=${productId} mid=${mediaId} in ${took(start)}`);
    // 204 No Content
    res.status(204).end();
  } catch (err) {
    try { if (db) await db.exec("ROLLBACK"); } catch {}
    console.error("❌ Delete media failed:", err);
    return sendErrorResponse(res, 500, "Delete media failed");
  }
});

export default handler;

