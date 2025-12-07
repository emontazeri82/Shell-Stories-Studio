"use client";

import { useSelector } from "react-redux";
import Layout from "@/components/layout/Layout";
import CheckoutForm from "@/components/CheckoutForm";
import OrderSummary from "@/components/OrderSummary";
import Link from "next/link";
import { useState, useEffect } from "react";

import {
  ShieldCheckIcon,
  LockClosedIcon,
  TruckIcon,
  ShoppingCartIcon,
  UserIcon,
  CreditCardIcon,
} from "@heroicons/react/24/outline";
import { calcTotals } from "@/lib/utils/calcTotals";

export default function CheckoutPage() {
  const items = useSelector((s) => s.cart.items);
  const sessionId = useSelector((s) => s.cart.sessionId || "guest-session");

  // ⭐ THIS IS THE FIX — single source of truth
  const [deliveryMethod, setDeliveryMethod] = useState("standard");

  // Your validated checkout data
  const [paymentData, setPaymentData] = useState(null);
  useEffect(() => {
    if (!items.length) return;
    setPaymentData((prev) => {
      if (!prev) return prev; // do nothing until first validation
      return {
        ...prev,
        deliveryMethod,
        totals: calcTotals(items, deliveryMethod),
      };
    });
  }, [deliveryMethod]);

  return (
    <Layout title="Checkout — Shell Stories">
      <div className="background-luxury min-h-screen pb-20">
        <div className="checkout-floating-lights pointer-events-none absolute inset-0"></div>
        <div className="flex items-center gap-2 text-[13px] text-zinc-500 mt-4 font-medium">

          {/* CART */}
          <span className="flex items-center gap-1 text-indigo-600 font-semibold">
            <ShoppingCartIcon className="h-4 w-4" />
            Cart
          </span>

          <span>›</span>

          {/* CONTACT */}
          <span className="flex items-center gap-1 font-semibold">
            <UserIcon className="h-4 w-4" />
            Contact
          </span>

          <span>›</span>

          {/* PAYMENT */}
          <span className="flex items-center gap-1 opacity-60">
            <CreditCardIcon className="h-4 w-4" />
            Payment
          </span>
        </div>

        {/* HEADER */}
        <div className="mt-6 mb-10">
          <h1 className="text-4xl font-extrabold tracking-tight text-zinc-900 dark:text-white">
            Checkout
          </h1>

          <Link
            href="/cart"
            className="
              inline-flex items-center gap-1 px-3 py-1.5 mt-2
              text-sm font-medium text-indigo-700 dark:text-indigo-300
              rounded-lg border border-indigo-200 dark:border-indigo-700
              bg-white/60 dark:bg-zinc-800/40
              backdrop-blur-sm shadow-sm
              hover:bg-indigo-50 dark:hover:bg-zinc-700/40
              hover:border-indigo-300 dark:hover:border-indigo-600
              transition-all
            "
          >
            ← Back to Cart
          </Link>

          {/* TRUST BAR */}
          <div
            className="
            flex items-center gap-4 mt-4 text-[13px] text-zinc-600 dark:text-zinc-400
            bg-white/70 dark:bg-zinc-800/50 backdrop-blur px-4 py-2 rounded-lg
            border border-zinc-200 dark:border-zinc-700 shadow
          "
          >
            <div className="flex items-center gap-1">
              <LockClosedIcon className="h-4 w-4" /> Secure Checkout
            </div>
            <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex items-center gap-1">
              <ShieldCheckIcon className="h-4 w-4" /> Buyer Protection
            </div>
            <div className="h-3 w-px bg-zinc-300 dark:bg-zinc-700" />
            <div className="flex items-center gap-1">
              <TruckIcon className="h-4 w-4" /> Fast Shipping
            </div>
          </div>
        </div>

        {/* MAIN GRID */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12">

          {/* LEFT COLUMN */}
          <div>
            <div
              className="
              bg-white dark:bg-zinc-900 p-8 rounded-xl shadow-sm
              border border-zinc-200 dark:border-zinc-700
            "
            >
              {/* CONTACT + DELIVERY FORM */}
              <h2 className="text-lg font-semibold mb-4 text-zinc-800 dark:text-zinc-200">
                Contact Information
              </h2>

              <CheckoutForm
                cartItems={items}
                sessionId={sessionId}
                deliveryMethod={deliveryMethod}
                setDeliveryMethod={setDeliveryMethod}
                onValidated={(data) => setPaymentData(data)}
              />
            </div>
          </div>

          {/* RIGHT COLUMN */}
          <div className="md:sticky md:top-8">
            <div
              className="
              bg-white dark:bg-zinc-900 p-6 rounded-xl shadow-sm
              border border-zinc-200 dark:border-zinc-700
            "
            >
              <OrderSummary
                items={items}
                paymentData={paymentData}
                sessionId={sessionId}
                deliveryMethod={deliveryMethod}
              />
            </div>

            <div className="text-xs text-zinc-500 dark:text-zinc-400 text-center mt-3">
              <div className="flex justify-center items-center gap-2">
                <LockClosedIcon className="h-4 w-4" />
                Your payment is encrypted.
              </div>
              <p className="mt-1">We never store card or PayPal information.</p>
            </div>
          </div>
        </div>
        {/* STEP INDICATOR */}
      </div>
    </Layout>
  );
}








