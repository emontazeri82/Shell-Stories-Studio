// pages/api/admin/orders.js
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '../auth/[...nextauth]'; // adjust path if necessary

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

export default async function handler(req, res) {
  // Protect route with admin session
  const session = await getServerSession(req, res, authOptions);
  const adminEmail = process.env.ADMIN_EMAIL;

  if (!session || session.user.email !== adminEmail) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  if (req.method !== 'GET') return res.status(405).end();

  try {
    const db = await openDB();
    const orders = await db.all(`
      SELECT o.*, s.tracking_number
      FROM orders o
      LEFT JOIN shipping_details s ON s.order_id = o.id
      ORDER BY o.created_at DESC
    `);

    res.status(200).json(orders);
  } catch (err) {
    console.error('DB error:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
}


