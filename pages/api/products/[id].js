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
    // Optional lightweight rate limit
    await rateLimiter(req, res, () => { }, { limit: 60, window: 60 });
    const { id } = req.query;

    if (!id) {
      return res.status(400).json({ error: 'Product ID is required' });
    }

    const db = await openDB();
    const product = await db.get('SELECT * FROM products WHERE id = ?', id);

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.status(200).json(product);
  } catch (err) {
    console.error('Error fetching product:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}
