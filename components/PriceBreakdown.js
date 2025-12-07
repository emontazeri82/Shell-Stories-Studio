"use client";

import React from "react";
import { calcTotals } from "@/lib/utils/calcTotals";

export default function PriceBreakdown({
  items = [],
  totals = null,      // <-- if provided, use calcTotals result
  showButtons = false,
  onCheckout,
  onClear
}) {

  // If totals is passed (checkout page), use it.
  // If not, only calculate subtotal for cart/cart panel.
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  const data = totals || { subtotal };

  return (
    <div className="mt-6 space-y-3 font-sans">

      {/* Always show subtotal */}
      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
        <span className="font-medium">Subtotal</span>
        <span className="font-semibold">${data.subtotal.toFixed(2)}</span>
      </div>

      {/* Only show tax + delivery + total when totals exist (Checkout page) */}
      {totals && (
        <>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Tax</span>
            <span className="font-semibold">${totals.tax.toFixed(2)}</span>
          </div>

          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
            <span className="font-medium">Delivery</span>
            <span className="font-semibold text-green-600">
              {totals.deliveryFee === 0 ? "Free" : `$${totals.deliveryFee.toFixed(2)}`}
            </span>
          </div>

          {totals.discount > 0 && (
            <div className="flex justify-between text-sm text-emerald-600 font-medium">
              <span>Discount</span>
              <span>- ${totals.discount.toFixed(2)}</span>
            </div>
          )}

          <div className="flex justify-between text-lg font-bold border-t pt-2 border-gray-200 dark:border-gray-600 dark:text-white">
            <span>Total</span>
            <span>${totals.total.toFixed(2)}</span>
          </div>
        </>
      )}

      {showButtons && (
        <>
          <button
            onClick={onCheckout}
            className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-semibold"
          >
            Proceed to Checkout
          </button>

          <button
            onClick={onClear}
            className="w-full text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium"
          >
            Clear Cart
          </button>
        </>
      )}
    </div>
  );
}
