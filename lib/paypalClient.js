// lib/paypalClient.js
import paypal from '@paypal/checkout-server-sdk';

let client;

function environment() {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error('Missing PayPal client ID or secret in environment variables');
  }

  return new paypal.core.SandboxEnvironment(clientId, clientSecret);
  // 🔒 Use LiveEnvironment for production:
  // return new paypal.core.LiveEnvironment(clientId, clientSecret);
}

export function getPayPalClient() {
  if (!client) {
    client = new paypal.core.PayPalHttpClient(environment());
  }
  return client;
}
