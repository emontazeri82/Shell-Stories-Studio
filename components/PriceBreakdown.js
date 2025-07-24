// components/PriceBreakdown.js
"use client";

import React, { useMemo } from "react";
export default function PriceBreakdown({ items = [], showButtons = false, onCheckout, onClear }) {
    const subtotal = useMemo(() => items.reduce((sum, item) => sum + item.price * item.quantity, 0), [items]);
    const shipping = useMemo(() => (subtotal > 50 ? 0 : 5.99), [subtotal]);
    const tax = useMemo(() => subtotal * 0.085, [subtotal]);
    const total = useMemo(() => subtotal + tax + shipping, [subtotal, tax, shipping]);
  
    return (
      <div className="mt-6 space-y-3 font-sans">
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Subtotal</span><span className="font-semibold">${subtotal.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Estimated Tax</span><span className="font-semibold">${tax.toFixed(2)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-600 dark:text-gray-300">
          <span className="font-medium">Estimated Shipping</span><span className="font-semibold">{shipping === 0 ? "Free" : `$${shipping.toFixed(2)}`}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2 border-gray-200 dark:border-gray-600 dark:text-white">
          <span>Total</span><span>${total.toFixed(2)}</span>
        </div>
  
        {showButtons && (
          <>
            <button onClick={onCheckout} className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-semibold">
              Proceed to Checkout
            </button>
            <button onClick={onClear} className="w-full text-sm text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium">
              Clear Cart
            </button>
          </>
        )}
      </div>
    );
  }
  