// components/OrderSummary.js
"use client";

import PriceBreakdown from "./PriceBreakdown";

export default function OrderSummary({ items }) {
  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const taxRate = 0.085;
  const tax = subtotal * taxRate;
  const deliveryFee = subtotal > 50 ? 0 : 5.99;
  const total = subtotal + tax + deliveryFee;

  return (
    <div className="border p-4 rounded-lg shadow-sm mb-6 bg-white">
      <h2 className="text-lg font-semibold mb-4">Order Summary</h2>

      <ul className="divide-y">
        {items.map((item) => (
          <li key={item.id} className="py-3 flex justify-between text-sm">
            <span>
              {item.name} <span className="text-gray-500">×{item.quantity}</span>
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
      </ul>

      {/* Price Breakdown */}
      <div className="pt-4 mt-4 border-t">
        <PriceBreakdown
          items={items}
          showButtons={false}
        />
      </div>
    </div>
  );
}

  