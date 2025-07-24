// lib/saveOrderToDB.js
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

export async function saveOrderToDB({
  sessionId,
  items,
  total,
  paymentMethod = 'PayPal',
  paypalOrderId,
  email,
  customerName,
  phone,
  delivery_method: deliveryMethod,
  shippingAddress = 'To be filled',
  billingAddress = 'To be filled'
}) {
  const db = await openDB();
  await db.exec('BEGIN');

  try {
    // Insert into orders
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
      ) VALUES (?, ?, ?, ?, ?, ?, 'Paid', ?, ?, ?, ?)`,
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
        deliveryMethod
      ]
    );

    const orderId = result.lastID;

    // Insert each item into order_items
    for (const item of items) {
      await db.run(
        `INSERT INTO order_items (order_id, product_id, quantity, price)
         VALUES (?, ?, ?, ?)`,
        [orderId, item.id, item.quantity, item.price]
      );
    }
    // Insert shipping details
    await db.run(
      `INSERT INTO shipping_details (order_id, shipping_status)
       VALUES (?, 'Pending')`,
      [orderId]
    );
    // clean up cart_item table
    await db.run(
      `DELETE FROM cart_items WHERE session_id = ?`,
      [sessionId]
    );
    
    await db.exec('COMMIT');
    return { success: true, orderId };
  } catch (err) {
    await db.exec('ROLLBACK');
    console.error('❌ Error saving order:', err);
    return { success: false, error: err.message };
  }
}

