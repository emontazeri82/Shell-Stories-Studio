
// pages/checkout/index.js
"use client";

import { useSelector } from "react-redux";
import OrderSummary from "@/components/OrderSummary";
import CheckoutForm from "@/components/CheckoutForm";

export default function CheckoutPage() {
  const cartItems = useSelector((state) => state.cart.items);
  const sessionId = useSelector((state) => state.cart.sessionId || "guest-session");

  return (
    <div className="max-w-4xl mx-auto p-4 font-poppins">
      <h1 className="text-xl font-bold mb-4">Review Your Order</h1>
      <CheckoutForm cartItems={cartItems} sessionId={sessionId} />
      <OrderSummary items={cartItems} />
    </div>
  );
}




