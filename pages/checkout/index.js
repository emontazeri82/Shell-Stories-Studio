
// pages/checkout/index.js
"use client";

import React from 'react';
import { useSelector } from 'react-redux';
import OrderSummary from '@/components/OrderSummary';
import CheckoutWithPayPal from '@/components/CheckoutWithPayPal';

export default function CheckoutPage() {
  const cartItems = useSelector((state) => state.cart.items);
  const sessionId = useSelector((state) => state.cart.sessionId || "guest-session"); // fallback

  // Calculate total on the fly, or let PayPal calculate from items
  const totalAmount = cartItems.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  return (
    <div className="max-w-4xl mx-auto p-4">
      <h1 className="text-xl font-bold mb-4">Review Your Order</h1>

      {/* Order Summary with auto-calculated breakdown */}
      <OrderSummary items={cartItems} />

      {/* PayPal Checkout */}
      <div className="mt-6">
        <CheckoutWithPayPal
          cartItems={cartItems}
          totalAmount={totalAmount}
          sessionId={sessionId}
        />
      </div>
    </div>
  );
}



