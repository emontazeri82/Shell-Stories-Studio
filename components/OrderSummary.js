"use client";

import { calcTotals } from "@/lib/utils/calcTotals";
import PriceBreakdown from "./PriceBreakdown";
import CheckoutWithPayPal from "./CheckoutWithPayPal";
import { getEstimatedDelivery } from "@/lib/utils/getEstimatedDelivery";
import Image from "next/image";
import { useDispatch } from "react-redux";
import { removeFromCart, decrementQuantity, incrementQuantity } from "@/redux/slices/cartSlice";
import { XMarkIcon } from "@heroicons/react/24/outline";


export default function OrderSummary({
  items,
  paymentData,
  sessionId,
  deliveryMethod,
}) {
  const finalTotals = calcTotals(items, deliveryMethod || "standard");
  const estimate = getEstimatedDelivery(deliveryMethod);
  const dispatch = useDispatch();

  return (
    <div
      className="
        border rounded-xl shadow-sm bg-white dark:bg-zinc-900 
        flex flex-col max-h-[75vh] overflow-y-auto
      "
    >
      {/* CONTENT (scrollable) */}
      <div className="p-6 pb-24">  {/* extra padding so PayPal doesn't overlap */}
        <h2 className="text-xl font-semibold mb-4">Order Summary</h2>

        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {items.map((item) => (
            <li
              key={item.id}
              className="py-4 flex items-center justify-between gap-3 text-sm"
            >
              {/* LEFT: Thumbnail + name + qty controls */}
              <div className="flex items-center gap-3">

                {/* Thumbnail — cloudinary OR fallback */}
                <div className="w-12 h-12 relative rounded-md overflow-hidden border border-zinc-200 dark:border-zinc-700">
                  <Image
                    src={
                      item.image_url ||
                      item.image ||
                      `/placeholder.png`
                    }
                    alt={item.name}
                    fill
                    className="object-cover"
                    sizes="48px"
                  />
                </div>

                {/* Name + Qty Counter */}
                <div className="flex flex-col">
                  <span className="font-medium text-zinc-800 dark:text-zinc-200">
                    {item.name}
                  </span>

                  {/* Quantity Controls */}
                  <div className="flex items-center gap-2 mt-0.5">
                    <button
                      className="
                        w-5 h-5 flex items-center justify-center 
                        rounded-full bg-zinc-200 dark:bg-zinc-700 
                        text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600
                      "
                      onClick={() =>
                        dispatch(decrementQuantity(item.id))
                      }
                    >
                      –
                    </button>

                    <span className="text-zinc-700 dark:text-zinc-300">
                      {item.quantity}
                    </span>

                    <button
                      className="
                        w-5 h-5 flex items-center justify-center 
                        rounded-full bg-zinc-200 dark:bg-zinc-700 
                        text-xs font-bold hover:bg-zinc-300 dark:hover:bg-zinc-600
                      "
                      onClick={() =>
                        dispatch(incrementQuantity(item.id))
                      }
                    >
                      +
                    </button>
                  </div>
                </div>
              </div>

              {/* RIGHT: Price */}
              <div className="flex items-center gap-2">

                {/* PRICE */}
                <span className="font-semibold">
                  ${(item.price * item.quantity).toFixed(2)}
                </span>

                {/* REMOVE BUTTON */}
                <button
                  onClick={() => dispatch(removeFromCart(item.id))}
                  className="
                    text-zinc-400 hover:text-red-500 
                    transition p-1
                  "
                  aria-label="Remove item"
                >
                  <XMarkIcon className="w-4 h-4" />
                </button>

              </div>

            </li>
          ))}
        </ul>

        <div className="pt-4 mt-4 border-t border-zinc-300 dark:border-zinc-700">
          <PriceBreakdown
            items={items}
            totals={finalTotals}
            showButtons={false}
          />
        </div>

        {estimate && (
          <div className="mt-4 p-3 rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-sm leading-snug">
            <p className="font-medium text-indigo-700 dark:text-indigo-300">
              Estimated delivery:
              <br />
              <span className="font-semibold">{estimate.range}</span>
            </p>
          </div>
        )}
      </div>

      {/* STICKY PAYPAL BUTTON */}
      <div
        className="
          sticky bottom-0 left-0 right-0 
          bg-white dark:bg-zinc-900 
          p-4 border-t border-zinc-200 dark:border-zinc-700 
          shadow-[0_-4px_12px_rgba(0,0,0,0.07)]
        "
      >
        <CheckoutWithPayPal
          cartItems={paymentData?.lockedCartItems || items}
          totals={paymentData?.totals || finalTotals}
          totalAmount={(paymentData?.totals || finalTotals).total}
          sessionId={sessionId}
          email={paymentData?.email || ""}
          phone={paymentData?.phone || ""}
          deliveryMethod={paymentData?.deliveryMethod || deliveryMethod}
          isFormValid={paymentData?.isFormValid ?? false}
        />
      </div>
    </div>
  );
}




