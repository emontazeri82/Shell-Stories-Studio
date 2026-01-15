// pages/api/paypal/create-order.js
import paypal from "@paypal/checkout-server-sdk";
import { calcTotals } from "@/lib/utils/calcTotals";  // ✅ server-side totals
import { getDb } from "@/lib/db/sqlite";
// Setup PayPal environment and client
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    console.log("🚀 create-order.js START");

    const { total: clientTotal, items, sessionId, deliveryMethod = "standard" } = req.body;

    console.log("📩 Incoming Body:", req.body);
    const safeDeliveryMethod =
      deliveryMethod === "pickup" ? "pickup" : "standard";
    if (!Array.isArray(items) || items.length === 0) {
      return res.status(400).json({ error: "Invalid items" });
    }

    for (const item of items) {
      if (!item.id || !item.name || item.price == null || item.quantity == null) {
        return res.status(400).json({
          error: "Malformed item received",
          item
        });
      }

      if (item.quantity < 1 || item.quantity > 20) {
        return res.status(400).json({
          error: "Invalid quantity",
          item
        });
      }
    }
    // ✅ ADD THE DB VALIDATION HERE (this is the correct location)
    const db = await getDb();

    for (const item of items) {
      const product = await db.get(
        "SELECT price FROM products WHERE id = ?",
        [item.id]
      );

      if (!product) {
        return res.status(400).json({ error: `Product not found: ${item.id}` });
      }

      if (Number(product.price) !== Number(item.price)) {
        return res.status(400).json({
          error: `Price mismatch for ${item.id}`,
          expected: product.price,
          received: item.price
        });
      }
    }
    // ---------------------------------------------------------
    // 🔒 1. SERVER-SIDE TOTALS (fraud-safe)
    // ---------------------------------------------------------
    const serverTotals = calcTotals(items, safeDeliveryMethod);

    console.log("🧮 Server Totals (authoritative):", serverTotals);
    console.log("⚠️ Client Total:", clientTotal);

    // Reject if client tries to manipulate total
    if (Number(clientTotal).toFixed(2) !== Number(serverTotals.total).toFixed(2)) {
      console.warn("🚨 Total mismatch detected! Client vs Server");
      return res.status(400).json({
        error: "Price validation failed. Please refresh checkout."
      });
    }

    // Use ONLY server totals for PayPal
    const { total, tax, deliveryFee } = serverTotals;
    const totalWithFees = Number(total).toFixed(2);

    // ---------------------------------------------------------
    // 🚚 Shipping preference
    // ---------------------------------------------------------
    const shippingPreference =
      safeDeliveryMethod === "pickup" ? "NO_SHIPPING" : "GET_FROM_FILE";

    // ---------------------------------------------------------
    // 💳 Create PayPal Order
    // ---------------------------------------------------------
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer("return=representation");

    request.requestBody({
      intent: "CAPTURE",
      purchase_units: [
        {
          custom_id: JSON.stringify({
            sessionId,
            deliveryMethod: safeDeliveryMethod
          }),
          amount: {
            currency_code: "USD",
            value: totalWithFees,
            breakdown: {
              item_total: {
                currency_code: "USD",
                value: serverTotals.subtotal.toFixed(2)
              },
              tax_total: {
                currency_code: "USD",
                value: tax.toFixed(2)
              },
              shipping: {
                currency_code: "USD",
                value: deliveryFee.toFixed(2)
              }
            }
          },

          items: items.map((item) => ({
            name: item.name,
            quantity: String(item.quantity || 1),
            unit_amount: {
              currency_code: "USD",
              value: Number(item.price).toFixed(2)
            },
            category: "PHYSICAL_GOODS"
          }))
        }
      ],
      application_context: {
        shipping_preference: shippingPreference,
        user_action: "PAY_NOW"
      }
    });

    const order = await client.execute(request);

    console.log("✅ PayPal Order Created:", order.result.id);

    return res.status(200).json({ id: order.result.id });

  } catch (error) {
    console.error("❌ PayPal Order Creation Error:", error);

    return res.status(500).json({ error: "Failed to create PayPal order" });
  }
}

