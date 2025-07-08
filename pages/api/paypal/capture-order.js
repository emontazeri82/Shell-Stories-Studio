
// pages/api/paypal/capture-order.js

import paypal from '@paypal/checkout-server-sdk';
import { getPayPalClient } from '@/lib/paypalClient';
import { saveOrderToDB } from '@/lib/saveOrderToDB';

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { orderID, cartItems, sessionId, total } = req.body;

  if (!orderID || !Array.isArray(cartItems) || !sessionId || typeof total !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid required order details' });
  }

  try {
    const client = getPayPalClient();
    const request = new paypal.orders.OrdersCaptureRequest(orderID);
    request.requestBody({});

    const response = await client.execute(request);
    const order = response.result;

    // ✅ Extract Buyer Info
    const payer = order.payer ?? {};
    const shipping = order.purchase_units?.[0]?.shipping ?? {};

    const email = payer.email_address || 'not_provided@example.com';
    const customerName = [payer.name?.given_name, payer.name?.surname].filter(Boolean).join(' ');
    const phone = payer.phone?.phone_number?.national_number || '';
    const addressParts = [
      shipping.address?.address_line_1,
      shipping.address?.admin_area_2,
      shipping.address?.postal_code
    ].filter(Boolean);
    const shippingAddress = addressParts.length ? addressParts.join(', ') : 'Address not provided';

    // ✅ Save Order to Database
    const saveResult = await saveOrderToDB({
      sessionId,
      items: cartItems,
      total,
      paymentMethod: 'PayPal',
      paypalOrderId: orderID,
      email,
      customerName,
      phone,
      shippingAddress,
      billingAddress: shippingAddress
    });

    if (!saveResult.success) {
      console.error('❌ Failed to save order to DB:', saveResult.error);
      return res.status(500).json({ error: 'Payment captured, but order not saved' });
    }

    console.log('✅ PayPal Order Captured and Saved:', {
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
    console.error('❌ PayPal Order Capture Failed:', error);
    return res.status(500).json({ error: 'Failed to capture and store PayPal order' });
  }
}



