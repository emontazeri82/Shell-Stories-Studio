// pages/api/clear-cart.js
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { sessionId } = req.body;
  if (!sessionId) return res.status(400).json({ error: 'Missing session ID' });

  try {
    const db = await openDB();
    await db.run(`DELETE FROM cart_items WHERE session_id = ?`, [sessionId]);
    res.status(200).json({ success: true });
  } catch (err) {
    console.error('Error clearing cart_items:', err);
    res.status(500).json({ error: 'Failed to clear cart' });
  }
}
