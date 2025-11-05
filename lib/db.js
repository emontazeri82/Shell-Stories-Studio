// /lib/db.js
import path from "path";
import { open } from "sqlite";
import sqlite3 from "sqlite3";

const dbPath = path.join(process.cwd(), "data", "shells_shop.db");

/**
 * Opens a SQLite connection safely.
 * Each call returns a new connection for lightweight operations.
 */
export async function openDB() {
  try {
    const db = await open({ filename: dbPath, driver: sqlite3.Database });
    await db.exec("PRAGMA foreign_keys = ON;");
    return db;
  } catch (err) {
    console.error("[DB] ❌ Failed to open database:", err);
    throw new Error("Database connection error");
  }
}

/* ──────────────────────────────
 * Product Queries
 * ──────────────────────────────*/

/** Fetches all products (raw, unfiltered). */
export async function getAllProducts() {
  const db = await openDB();
  try {
    const rows = await db.all("SELECT * FROM products");
    console.log(`[DB] ✅ Loaded ${rows.length} products`);
    return rows;
  } catch (err) {
    console.error("[DB] ❌ getAllProducts failed:", err);
    throw err;
  } finally {
    await db.close();
  }
}

/** Fetch a single product (no media). */
export async function getProductById(id) {
  const db = await openDB();
  try {
    const product = await db.get("SELECT * FROM products WHERE id = ?", id);
    console.log(`[DB] ✅ getProductById(${id}) → ${product ? "found" : "not found"}`);
    return product;
  } catch (err) {
    console.error("[DB] ❌ getProductById failed:", err);
    throw err;
  } finally {
    await db.close();
  }
}

/**
 * Fetch product (active only) + full media set.
 */
export async function getProductWithMediaById(id) {
  const db = await openDB();
  try {
    const product = await db.get(
      `SELECT id, name, description, price, stock, image_url, image_public_id,
              category, is_active, is_favorite, created_at, updated_at
         FROM products
        WHERE id = ? AND is_active = 1`,
      id
    );

    if (!product) {
      console.warn(`[DB] ⚠️ getProductWithMediaById(${id}) → no active product`);
      return null;
    }

    const mediaRows = await db.all(
      `SELECT id, product_id, kind, public_id, secure_url, format,
              width, height, duration, sort_order, is_primary, created_at
         FROM product_media
        WHERE product_id = ?
        ORDER BY is_primary DESC, sort_order ASC, id ASC`,
      id
    );

    console.log(`[DB] ✅ getProductWithMediaById(${id}) → ${mediaRows.length} media items`);

    return {
      ...product,
      price: Number(product.price),
      stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : null,
      is_active: Number(product.is_active) === 1,
      is_favorite: Number(product.is_favorite) === 1,
      media: mediaRows.map((m) => ({
        id: m.id,
        kind: m.kind, // "image" | "video"
        secure_url: m.secure_url,
        public_id: m.public_id,
        format: m.format,
        width: Number.isFinite(Number(m.width)) ? Number(m.width) : null,
        height: Number.isFinite(Number(m.height)) ? Number(m.height) : null,
        duration: Number.isFinite(Number(m.duration)) ? Number(m.duration) : null,
        sort_order: Number.isFinite(Number(m.sort_order)) ? Number(m.sort_order) : 0,
        is_primary: Number(m.is_primary) === 1,
        created_at: m.created_at,
      })),
    };
  } catch (err) {
    console.error("[DB] ❌ getProductWithMediaById failed:", err);
    throw err;
  } finally {
    await db.close();
  }
}

/** Fetch all active products for card/list views. */
export async function getAllProductsForList() {
  const db = await openDB();
  try {
    const rows = await db.all(`
      SELECT
        p.id, p.name, p.description, p.price, p.stock, p.image_url,
        p.category, p.is_active, p.is_favorite, p.created_at,
        pm.secure_url   AS primary_media_url,
        pm.kind         AS primary_media_kind,
        pm.public_id    AS primary_media_public_id
      FROM products p
      LEFT JOIN product_media pm
        ON pm.id = (
          SELECT id FROM product_media
          WHERE product_id = p.id
          ORDER BY is_primary DESC, sort_order ASC, id ASC
          LIMIT 1
        )
      WHERE p.is_active = 1
      ORDER BY p.created_at DESC
    `);

    console.log(`[DB] ✅ getAllProductsForList → ${rows.length} active products`);

    return rows.map((r) => ({
      id: r.id,
      name: r.name,
      description: r.description,
      price: Number(r.price),
      stock: Number.isFinite(Number(r.stock)) ? Number(r.stock) : null,
      category: r.category,
      is_active: Number(r.is_active) === 1,
      is_favorite: Number(r.is_favorite) === 1,
      created_at: r.created_at,
      image_url: r.primary_media_url || r.image_url || null,
      primaryMedia: r.primary_media_url
        ? {
            url: r.primary_media_url,
            kind: r.primary_media_kind,
            public_id: r.primary_media_public_id,
          }
        : null,
    }));
  } catch (err) {
    console.error("[DB] ❌ getAllProductsForList failed:", err);
    throw err;
  } finally {
    await db.close();
  }
}

/** Fetch all active product IDs for static paths. */
export async function getAllProductIds() {
  const db = await openDB();
  try {
    const rows = await db.all(`SELECT id FROM products WHERE is_active = 1`);
    console.log(`[DB] ✅ getAllProductIds → ${rows.length} ids`);
    return rows.map((r) => r.id);
  } catch (err) {
    console.error("[DB] ❌ getAllProductIds failed:", err);
    throw err;
  } finally {
    await db.close();
  }
}

/* ──────────────────────────────
 * 🔧 UNIVERSAL QUERY FUNCTION
 * ──────────────────────────────*/

/**
 * Execute arbitrary SQL queries safely.
 * Works for SELECT / INSERT / UPDATE / DELETE.
 */
export async function query(sql, params = []) {
  const db = await openDB();
  try {
    const trimmed = sql.trim().toUpperCase();
    const isSelect = trimmed.startsWith("SELECT");
    const isInsert = trimmed.startsWith("INSERT");

    let result;
    if (isSelect) {
      result = await db.all(sql, params);
    } else if (isInsert) {
      const run = await db.run(sql, params);
      result = { lastID: run.lastID, changes: run.changes };
    } else {
      const run = await db.run(sql, params);
      result = { changes: run.changes };
    }

    return result;
  } catch (err) {
    console.error("[DB] ❌ Query failed:", sql, params, err);
    throw err;
  } finally {
    await db.close();
  }
}

/* ──────────────────────────────
 * Aliases (for backward compatibility)
 * ──────────────────────────────*/
export { getAllProductsForList as getAllProductsSummary };
export { getProductWithMediaById as getProductByIdWithMedia };



