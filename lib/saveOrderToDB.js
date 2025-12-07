// /lib/saveOrderToDB.js
import { open } from "sqlite";
import sqlite3 from "sqlite3";
import path from "path";

const dbPath = path.join(process.cwd(), "data", "shells_shop.db");

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

/**
 * Saves an order and related records atomically.
 * Fully compatible with the product_media system.
 */
export async function saveOrderToDB({
  sessionId,
  items,
  total,
  paymentMethod = "PayPal",
  paypalOrderId,
  email,
  customerName,
  phone,
  delivery_method: deliveryMethod,
  shippingAddress = "To be filled",
  billingAddress = "To be filled",
}) {
  const db = await openDB();
  await db.exec("BEGIN");
  const t0 = Date.now();

  try {
    console.log(`[DB] ▶ Starting saveOrderToDB for session ${sessionId}`);

    // 1️⃣ Insert into orders
    const result = await db.run(
      `INSERT INTO orders (
        session_id,
        paypal_order_id,
        email,
        customer_name,
        phone,
        total_price,
        payment_status,
        shipping_address,
        billing_address,
        payment_method,
        delivery_method
      )
      VALUES (?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?, ?)`,
      [
        sessionId,
        paypalOrderId,
        email,
        customerName,
        phone,
        total,
        shippingAddress,
        billingAddress,
        paymentMethod,
        deliveryMethod,
      ]
    );

    const orderId = result.lastID;
    console.log(`[DB] ✅ Order created → id=${orderId}`);

    // 2️⃣ Insert each purchased item
    if (!Array.isArray(items) || items.length === 0) {
      throw new Error("No items provided for order.");
    }

    for (const item of items) {
      if (!item?.id) {
        console.warn("⚠️ Skipping malformed item:", item);
        continue;
      }

      await db.run(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }
    console.log(`[DB] 🧾 Inserted ${items.length} order_items`);

    // 3️⃣ Insert shipping details
    await db.run(
      `INSERT INTO shipping_details (order_id, shipping_status)
       VALUES (?, 'Pending')`,
      [orderId]
    );
    console.log(`[DB] 🚚 Shipping record created for order ${orderId}`);

    // 4️⃣ Clean up cart
    await db.run(`DELETE FROM cart_items WHERE session_id = ?`, [sessionId]);
    console.log(`[DB] 🧹 Cleared cart for session ${sessionId}`);

    // 🔻 Decrement stock for each purchased item
    for (const item of items) {
      await db.run(
        "UPDATE products SET stock = stock - ? WHERE id = ? AND stock >= ?",
        [item.quantity, item.id, item.quantity]
      );
    }
    
    await db.exec("COMMIT");
    console.log(`[DB] ✅ Transaction committed (${Date.now() - t0}ms)`);

    return { success: true, orderId };
  } catch (err) {
    await db.exec("ROLLBACK");
    console.error("❌ saveOrderToDB failed, rolled back:", err);
    return { success: false, error: err.message };
  } finally {
    try {
      await db.close();
    } catch { }
  }
}

