// lib/db.js
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');
export const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// --- Existing helpers (kept for compatibility) ---
export async function getAllProducts() {
  const db = await openDB();
  return db.all('SELECT * FROM products');
}

export async function getProductById(id) {
  const db = await openDB();
  return db.get('SELECT * FROM products WHERE id = ?', id);
}

// --- Public detail page helper: product + full media (only active products) ---
export async function getProductWithMediaById(id) {
  const db = await openDB();

  const product = await db.get(
    `SELECT id, name, description, price, stock, image_url, image_public_id,
            category, is_active, is_favorite, created_at, updated_at
       FROM products
      WHERE id = ? AND is_active = 1`,
    id
  );
  if (!product) return null;

  const mediaRows = await db.all(
    `SELECT id, product_id, kind, public_id, secure_url, format,
            width, height, duration, sort_order, is_primary, created_at
       FROM product_media
      WHERE product_id = ?
      ORDER BY is_primary DESC, sort_order ASC, id ASC`,
    id
  );

  return {
    ...product,
    price: Number(product.price),
    stock: Number.isFinite(Number(product.stock)) ? Number(product.stock) : null,
    is_active: Number(product.is_active) === 1,
    is_favorite: Number(product.is_favorite) === 1,
    media: mediaRows.map(m => ({
      id: m.id,
      kind: m.kind,                 // "image" | "video"
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
}

// --- Listing helper for product cards (active only) with primary media fallback ---
export async function getAllProductsForList() {
  const db = await openDB();

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

  return rows.map(r => ({
    id: r.id,
    name: r.name,
    description: r.description,
    price: Number(r.price),
    stock: Number.isFinite(Number(r.stock)) ? Number(r.stock) : null,
    category: r.category,
    is_active: Number(r.is_active) === 1,
    is_favorite: Number(r.is_favorite) === 1,
    created_at: r.created_at,

    // ✅ reliable image for cards & previews:
    image_url: r.primary_media_url || r.image_url || null,

    // Optional richer meta (useful for components that prefer explicit primary media):
    primaryMedia: r.primary_media_url
      ? {
          url: r.primary_media_url,
          kind: r.primary_media_kind,            // "image" | "video"
          public_id: r.primary_media_public_id,
        }
      : null,
  }));
}

// --- IDs for getStaticPaths (only active products) ---
export async function getAllProductIds() {
  const db = await openDB();
  const rows = await db.all(`SELECT id FROM products WHERE is_active = 1`);
  return rows.map(r => r.id);
}

// --- Aliases to keep your existing imports working ---
export { getAllProductsForList as getAllProductsSummary };
export { getProductWithMediaById as getProductByIdWithMedia };


