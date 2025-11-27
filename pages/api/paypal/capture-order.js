// pages/api/paypal/capture-order.js

import paypal from '@paypal/checkout-server-sdk';
import { getPayPalClient } from '@/lib/paypalClient';
import { saveOrderToDB } from '@/lib/saveOrderToDB';
import { calcTotals } from '@/lib/utils/calcTotals';   // ✅ server-side totals
import { getDb } from "@/lib/db/sqlite";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  console.log("🚀 capture-order.js called");
  console.log("📩 Incoming Body:", req.body);

  const {
    orderID,
    cartItems,
    sessionId,
    total: clientTotal,
    deliveryMethod,
    email: formEmail,
    phone: formPhone
  } = req.body;

  if (!orderID || !Array.isArray(cartItems) || !sessionId || typeof clientTotal !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid required order details' });
  }

  try {
    // -------------------------------------------------------
    // 🔒 1. RE-CALCULATE TOTALS ON SERVER (fraud protection)
    // -------------------------------------------------------
    const serverTotals = calcTotals(cartItems, deliveryMethod);
    console.log("🧮 Server Totals:", serverTotals);
    console.log("⚠️ Client Total:", clientTotal);

    if (Number(clientTotal).toFixed(2) !== Number(serverTotals.total).toFixed(2)) {
      console.warn("🚨 TOTAL MISMATCH — possible tampering");
      return res.status(400).json({
        error: "Price validation failed",
        details: {
          clientTotal,
          serverTotal: serverTotals.total
        }
      });
    }

    // -------------------------------------------------------
    // 🟢 2. Capture PayPal Order
    // -------------------------------------------------------
    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await client.execute(request);
    const order = response.result;

    // -------------------------------------------------------
    // 📌 3. Extract Buyer & Shipping Info
    // -------------------------------------------------------
    const payer = order.payer ?? {};
    const shipping = order.purchase_units?.[0]?.shipping ?? {};

    const email =
      formEmail ||
      payer.email_address ||
      "not_provided@example.com";

    const customerName =
      [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(" ") ||
      "Guest";

    const phone =
      formPhone ||
      payer.phone?.phone_number?.national_number ||
      "";

    const addressParts = [
      shipping.address?.address_line_1,
      shipping.address?.admin_area_2,
      shipping.address?.postal_code
    ].filter(Boolean);

    const shippingAddress = addressParts.length
      ? addressParts.join(", ")
      : "Address not provided";
    //----------------------------------------------------
    // 🔒 SECURITY: Validate prices, stock, totals
    //----------------------------------------------------

    const db = await getDb();

    // 2️⃣ Validate each cart item price + stock
    for (const item of cartItems) {
      const product = await db.get(
        "SELECT price, stock FROM products WHERE id = ?",
        [item.id]
      );

      if (!product) {
        return res.status(400).json({
          error: `❌ Product not found: ${item.id}`
        });
      }

      // Price manipulation attempt?
      if (Number(product.price) !== Number(item.price)) {
        return res.status(400).json({
          error: `❌ Price mismatch detected for product ${item.id}`,
          expected: product.price,
          received: item.price,
        });
      }

      // Stock too low?
      if (product.stock < item.quantity) {
        return res.status(400).json({
          error: `❌ Not enough stock for product ${item.id}`,
          available: product.stock,
          requested: item.quantity,
        });
      }
    }
    

    // -------------------------------------------------------
    // 💾 4. Save Order to DB (using SECURE TOTAL)
    // -------------------------------------------------------
    const saveResult = await saveOrderToDB({
      sessionId,
      items: cartItems,
      total: serverTotals.total,    // ✅ AUTHORITATIVE TOTAL
      paymentMethod: "PayPal",
      paypalOrderId: orderID,
      email,
      customerName,
      phone,
      delivery_method: deliveryMethod,
      shippingAddress,
      billingAddress: shippingAddress
    });

    if (!saveResult.success) {
      console.error("❌ Failed to save order to DB:", saveResult.error);
      return res.status(500).json({ error: "Payment captured, but order not saved" });
    }

    console.log("✅ PayPal Order Captured and Saved:", {
      orderID,
      payerEmail: email,
      customerName,
      shippingAddress
    });

    return res.status(200).json({
      success: true,
      orderID,
      status: order.status,
      savedOrderID: saveResult.orderId
    });

  } catch (error) {
    console.error("❌ PayPal Order Capture Failed:", error);
    return res.status(500).json({ error: "Failed to capture and store PayPal order" });
  }
}




