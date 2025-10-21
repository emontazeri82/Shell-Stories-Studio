// pages/api/products/index.js
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { rateLimiter } from '@/lib/middleware/rateLimiter';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');
const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// tiny helper
const toBool = (v) => Number(v) === 1;

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: `Method ${req.method} not allowed` });
  }

  try {
    // public rate limit
    await rateLimiter(req, res, () => { }, { limit: 120, window: 60 });

    const db = await openDB();

    // ── Query params
    const page = Math.max(1, Number(req.query.page || 1));
    const pageSize = Math.min(100, Math.max(1, Number(req.query.pageSize || req.query.limit || 24)));
    const offset = (page - 1) * pageSize;

    const q = (req.query.q || '').trim();
    const category = (req.query.category || '').trim();
    const favoriteOnly = req.query.favorite === '1' || req.query.favorites === '1';
    const includeMedia = req.query.includeMedia === '1';
    const sort = (req.query.sort || 'recent').toLowerCase(); // recent | price_asc | price_desc | random

    // ── WHERE
    const where = ['p.is_active = 1'];
    const params = [];

    if (q) {
      where.push('(p.name LIKE ? OR p.description LIKE ?)');
      params.push(`%${q}%`, `%${q}%`);
    }
    if (category) {
      where.push('p.category = ?');
      params.push(category);
    }
    if (favoriteOnly) {
      where.push('p.is_favorite = 1');
    }

    const whereSQL = where.length ? `WHERE ${where.join(' AND ')}` : '';

    // ── ORDER BY
    let orderSQL = 'ORDER BY p.created_at DESC, p.id DESC';
    if (sort === 'price_asc') orderSQL = 'ORDER BY p.price ASC, p.id DESC';
    if (sort === 'price_desc') orderSQL = 'ORDER BY p.price DESC, p.id DESC';
    if (sort === 'random') orderSQL = 'ORDER BY RANDOM()';

    // ── COUNT for pagination
    const totalRow = await db.get(`SELECT COUNT(*) AS count FROM products p ${whereSQL}`, params);
    const total = Number(totalRow?.count || 0);

    // ── Main query with a primary-media subselect
    // pm* fields are for the "primary" media (is_primary DESC, sort_order ASC, id ASC)
    const items = await db.all(
      `
      SELECT
        p.id, p.name, p.description, p.price, p.stock,
        p.image_url, p.image_public_id, p.category,
        p.is_active, p.is_favorite, p.created_at, p.updated_at,
        pm.secure_url AS primary_media_url,
        pm.kind       AS primary_media_kind,
        pm.public_id  AS primary_media_public_id
      FROM products p
      LEFT JOIN product_media pm
        ON pm.id = (
          SELECT id
          FROM product_media
          WHERE product_id = p.id
          ORDER BY is_primary DESC, sort_order ASC, id ASC
          LIMIT 1
        )
      ${whereSQL}
      ${orderSQL}
      LIMIT ? OFFSET ?
      `,
      [...params, pageSize, offset]
    );

    // Normalize types + minimal primary media object
    const normalized = items.map((p) => ({
      id: p.id,
      name: p.name,
      description: p.description,
      price: Number(p.price),
      stock: Number.isFinite(Number(p.stock)) ? Number(p.stock) : null,

      // ✅ Fallback to primary media so cards always get an image
      image_url: p.image_url || p.primary_media_url || null,
      image_public_id: p.image_public_id || p.primary_media_public_id || null,

      category: p.category,
      is_active: toBool(p.is_active),
      is_favorite: toBool(p.is_favorite),
      created_at: p.created_at,
      updated_at: p.updated_at,
      primaryMedia: p.primary_media_url
        ? {
          url: p.primary_media_url,
          kind: p.primary_media_kind,         // "image" | "video"
          public_id: p.primary_media_public_id,
        }
        : null,
      // media: [] // optionally filled below if includeMedia=1
    }));

    // ── Optional: include all media for the returned products
    if (includeMedia && normalized.length) {
      const ids = normalized.map((p) => p.id);
      const placeholders = ids.map(() => '?').join(',');
      const mediaRows = await db.all(
        `
        SELECT id, product_id, kind, public_id, secure_url, format,
               width, height, duration, sort_order, is_primary, created_at
        FROM product_media
        WHERE product_id IN (${placeholders})
        ORDER BY product_id ASC, is_primary DESC, sort_order ASC, id ASC
        `,
        ids
      );

      const byProduct = new Map();
      normalized.forEach((p) => byProduct.set(p.id, []));
      for (const m of mediaRows) {
        byProduct.get(m.product_id).push({
          id: m.id,
          kind: m.kind,
          secure_url: m.secure_url,
          public_id: m.public_id,
          format: m.format,
          width: m.width ? Number(m.width) : null,
          height: m.height ? Number(m.height) : null,
          duration: m.duration ? Number(m.duration) : null,
          sort_order: m.sort_order ? Number(m.sort_order) : 0,
          is_primary: toBool(m.is_primary),
          created_at: m.created_at,
        });
      }
      normalized.forEach((p) => (p.media = byProduct.get(p.id) || []));
    }

    // Cache for edge/CDN
    res.setHeader('Cache-Control', 's-maxage=60, stale-while-revalidate=300');

    return res.status(200).json({
      items: normalized,
      page,
      pageSize,
      total,
      hasMore: page * pageSize < total,
    });
  } catch (err) {
    console.error('❌ Failed to fetch products:', err);
    return res.status(500).json({ error: 'Failed to fetch products' });
  }
}
