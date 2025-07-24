// pages/api/paypal/create-order.js
import paypal from '@paypal/checkout-server-sdk';

// Setup PayPal environment and client
const environment = new paypal.core.SandboxEnvironment(
  process.env.PAYPAL_CLIENT_ID,
  process.env.PAYPAL_CLIENT_SECRET
);
const client = new paypal.core.PayPalHttpClient(environment);

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { total, items, sessionId, deliveryMethod = "standard" } = req.body;
    console.log("🛒 sessionId in CheckoutWithPayPal:", sessionId);


    // Validate input
    if (
      typeof total !== 'number' ||
      !Array.isArray(items) ||
      items.length === 0
    ) {
      return res.status(400).json({ error: 'Missing or invalid required fields' });
    }

    // Calculate breakdowns
    const taxRate = 0.085;
    const tax = Number((total * taxRate).toFixed(2));
    const deliveryFee = total > 50 ? 0 : 5.99;
    const totalWithFees = (total + tax + deliveryFee).toFixed(2);

    console.log('Creating PayPal order:', {
      total,
      tax,
      deliveryFee,
      totalWithFees,
      itemsCount: items.length,
      sessionId: sessionId || 'N/A'
    });

    const shippingPreference =
      deliveryMethod === "pickup" ? "NO_SHIPPING" : "GET_FROM_FILE";

    // Create PayPal order request
    const request = new paypal.orders.OrdersCreateRequest();
    request.prefer('return=representation');
    request.requestBody({
      intent: 'CAPTURE',
      purchase_units: [
        {
          amount: {
            currency_code: 'USD',
            value: totalWithFees,
            breakdown: {
              item_total: {
                currency_code: 'USD',
                value: total.toFixed(2)
              },
              tax_total: {
                currency_code: 'USD',
                value: tax.toFixed(2)
              },
              shipping: {
                currency_code: 'USD',
                value: deliveryFee.toFixed(2)
              }
            }
          },
          items: items.map((item) => ({
            name: item.name,
            quantity: String(item.quantity || 1),
            unit_amount: {
              currency_code: 'USD',
              value: Number(item.price).toFixed(2)
            },
            category: 'PHYSICAL_GOODS'
          }))
        }
      ],
      application_context: {
        shipping_preference: shippingPreference,
        user_action: "PAY_NOW"
      }
    });

    const order = await client.execute(request);
    res.status(200).json({ id: order.result.id });

  } catch (error) {
    console.error('PayPal Order Creation Error:', error);
    res.status(500).json({ error: 'Failed to create PayPal order' });
  }
}

