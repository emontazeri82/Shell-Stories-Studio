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

    // 1️⃣ Get the base order list (kept EXACTLY like your version)
    const rawOrders = await db.all(`
      SELECT 
        o.*,
    
        -- shipping_details
        s.tracking_number,
        s.shipping_status,
        s.shipped_at,
        s.delivered_at,
    
        -- order_shipping_addresses
        osa.name        AS shipping_name,
        osa.phone       AS shipping_phone,
        osa.address_1,
        osa.address_2,
        osa.city,
        osa.state,
        osa.postal_code,
        osa.country,
        osa.source      AS shipping_source
    
      FROM orders o
      LEFT JOIN shipping_details s 
        ON s.order_id = o.id
    
      LEFT JOIN order_shipping_addresses osa
        ON osa.order_id = o.id
    
      ORDER BY o.created_at DESC
    `);


    // 2️⃣ Fetch all order items WITH product info (added feature)
    const itemRows = await db.all(`
      SELECT 
        oi.order_id,
        oi.product_id,
        oi.quantity,
        oi.price,
        p.name AS product_name,
        p.image_url
      FROM order_items oi
      LEFT JOIN products p ON oi.product_id = p.id
    `);

    // 3️⃣ Attach order_items → each order (added feature)
    const orders = rawOrders.map(order => ({
      ...order,
      items: itemRows.filter(item => item.order_id === order.id)
    }));

    return sendSuccessResponse(res, 200, "Orders fetched successfully", { orders });

  } catch (err) {
    console.error("❌ Failed to fetch orders:", err);
    return sendErrorResponse(res, 500, "Failed to fetch orders");
  }
});

export default handler;



