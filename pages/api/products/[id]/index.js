// pages/api/products/[id]/index.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { rateLimiter } from '@/lib/middleware/rateLimiter';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');
const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// small helpers
const toNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : null);
const toBool = (v) => Number(v) === 1;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    await rateLimiter(req, res, () => {}, { limit: 120, window: 60 });

    const id = Number(req.query.id);
    if (!Number.isFinite(id) || id <= 0) {
      return res.status(400).json({ error: 'Invalid product id' });
    }

    const db = await openDB();

    // NOTE: removed updated_at from the select
    const product = await db.get(
      `SELECT id, name, description, price, stock, image_url, image_public_id,
              category, is_active, is_favorite, created_at
         FROM products
        WHERE id = ? AND is_active = 1`,
      id
    );

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    const mediaRows = await db.all(
      `SELECT id, product_id, kind, public_id, secure_url, format,
              width, height, duration, sort_order, is_primary, created_at
         FROM product_media
        WHERE product_id = ?
        ORDER BY is_primary DESC, sort_order ASC, id ASC`,
      id
    );

    const media = mediaRows.map((m) => ({
      id: m.id,
      kind: m.kind, // "image" | "video"
      secure_url: m.secure_url,
      public_id: m.public_id,
      format: m.format,
      width: toNum(m.width),
      height: toNum(m.height),
      duration: toNum(m.duration),
      sort_order: toNum(m.sort_order) ?? 0,
      is_primary: toBool(m.is_primary),
      created_at: m.created_at,
    }));

    // primary/thumbnail fallback
    const primary = media[0] || null;
    const thumbnail_url = primary?.secure_url || product.image_url || null;

    const response = {
      id: product.id,
      name: product.name,
      description: product.description,
      price: toNum(product.price) ?? 0,
      stock: toNum(product.stock),
      image_url: product.image_url,
      image_public_id: product.image_public_id || null,
      category: product.category,
      is_active: toBool(product.is_active),
      is_favorite: toBool(product.is_favorite),
      created_at: product.created_at,

      thumbnail_url,
      primaryMedia: primary
        ? { url: primary.secure_url, kind: primary.kind, public_id: primary.public_id }
        : null,

      media,
    };

    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');
    return res.status(200).json({ product: response });
  } catch (err) {
    console.error('Error fetching product:', err);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
