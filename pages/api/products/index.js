import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';
import { rateLimiter } from '@/lib/middleware/rateLimiter';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

export default async function handler(req, res) {
  try {
    // ⏳ Lightweight rate limiting for public endpoint
    await rateLimiter(req, res, () => {}, { limit: 60, window: 60 });
    const db = await openDB();

    const products = await db.all(`
      SELECT * FROM products
      WHERE is_active = 1
      ORDER BY created_at DESC 
    `);
    res.status(200).json(products);
  } catch (err) {
    console.error('❌ Failed to fetch products:', err);
    res.status(500).json({ error: 'Failed to fetch products' });
  } 
} 