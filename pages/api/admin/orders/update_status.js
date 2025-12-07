// pages/api/admin/orders/update_status.js
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { createAdminHandler } from "@/lib/middleware/createAdminHandler";
import { sendSuccessResponse, sendErrorResponse } from "@/lib/api";

const dbPath = path.join(process.cwd(), "data", "shells_shop.db");

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

const handler = createAdminHandler();

handler.patch(async (req, res) => {
  try {
    // Normalize axios body
    let body = req.body;
    if (typeof body === "string") body = JSON.parse(body);

    const { orderId, action } = body;

    if (!orderId || !action) {
      return sendErrorResponse(res, 400, "Missing orderId or action");
    }

    const validActions = ["ship", "deliver", "pickup"];
    if (!validActions.includes(action)) {
      return sendErrorResponse(res, 400, "Invalid action");
    }

    const db = await openDB();

    // Ensure one shipping row exists
    await db.run(
      `INSERT OR IGNORE INTO shipping_details (order_id) VALUES (?)`,
      [orderId]
    );

    // Always update ONLY the newest row for safety
    const whereClause = `
      WHERE order_id = ?
      AND id = (SELECT MAX(id) FROM shipping_details WHERE order_id = ?)
    `;

    let query = "";

    if (action === "ship") {
      query = `
        UPDATE shipping_details
        SET shipping_status = 'Shipped',
            shipped_at = datetime('now')
        ${whereClause}
      `;
    }

    if (action === "deliver") {
      query = `
        UPDATE shipping_details
        SET shipping_status = 'Delivered',
            delivered_at = datetime('now')
        ${whereClause}
      `;
    }

    if (action === "pickup") {
      query = `
        UPDATE shipping_details
        SET shipping_status = 'Picked Up',
            delivered_at = datetime('now')
        ${whereClause}
      `;
    }

    // Execute update
    await db.run(query, [orderId, orderId]);

    return sendSuccessResponse(res, 200, "Order status updated successfully");
  } catch (err) {
    console.error("❌ Update failed:", err);
    return sendErrorResponse(res, 500, "Internal server error");
  }
});

export default handler;

