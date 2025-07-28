// pages/api/admin/orders.js
import path from 'path';
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';

import { sendErrorResponse, sendSuccessResponse } from '@/lib/api'; // ✅ Consistent API response format
import { createAdminHandler } from '@/lib/middleware/createAdminHandler';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}


// 👇 Create handler with built-in rate limit + auth
const handler = createAdminHandler();

// 📦 GET all orders (admin only)
handler.get(async (req, res) => {
  try {
    const db = await openDB();
    const orders = await db.all(`
      SELECT o.*, s.tracking_number
      FROM orders o
      LEFT JOIN shipping_details s ON s.order_id = o.id
      ORDER BY o.created_at DESC
    `);

    return sendSuccessResponse(res, 200, 'Orders fetched successfully', { orders });
  } catch (err) {
    console.error('❌ Failed to fetch orders:', err);
    return sendErrorResponse(res, 500, 'Failed to fetch orders');
  }
});

export default handler;



