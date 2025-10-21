// components/CartItem.js
"use client";

import Image from "next/image";
import { useDispatch, useSelector } from "react-redux";
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
} from "@/redux/slices/cartSlice";
import { XMarkIcon } from "@heroicons/react/24/outline";
import { memo } from "react";
import { motion, useAnimation, AnimatePresence } from "framer-motion";

function CartItem({ item }) {
  const dispatch = useDispatch();
  
  const product = useSelector((s) =>
      s.products?.items?.find((p) => p.id === item.id)
  );

  const name = product?.name ?? item.name;
  const desc = product?.description ?? item.description;
  const price = Number(product?.price ?? item.price ?? 0);
  const stock = product?.stock ?? item.stock;

  // Stock helpers
  const rawStock = Number(stock);
  const hasStockCap = Number.isFinite(rawStock);
  const stockNum = hasStockCap ? rawStock : Infinity;
  const inStock = stockNum > 0;
  const maxReached = hasStockCap && item.quantity >= stockNum;
  const remaining = hasStockCap ? Math.max(stockNum - item.quantity, 0) : null;
  const stockHelperId = hasStockCap ? `stock-helper-${item.id}` : undefined;


  // Gentle nudge for invalid + attempts
  const controls = useAnimation();
  const nudge = () =>
    controls.start({
      x: [0, -4, 4, -2, 2, 0],
      transition: { duration: 0.28 },
    });

  return (
    <div className="group/cart relative flex items-start gap-4 md:gap-5 py-4 border-b border-gray-200 dark:border-gray-700 font-inter">
      {/* Thumbnail */}
      <div className="group w-24 h-24 relative rounded-xl overflow-hidden ring-1 ring-black/5 dark:ring-white/5">
        <Image
          src={item.image_url}
          alt={name}
          fill
          className="object-cover transition-transform duration-300 group-hover:scale-[1.03] group-hover:-rotate-[0.5deg]"
          sizes="96px"
        />
      </div>

      {/* Main column */}
      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg sm:text-[1.2rem] font-playfair tracking-tight text-gray-900 dark:text-gray-100">
              {name}
            </h2>

            {/* Short blurb under title on mobile only */}
            {desc && (
              <p className="md:hidden text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                {desc}
              </p>
            )}

            <p className="text-sm font-inter text-gray-500 dark:text-gray-400 tabular-nums">
              ${price.toFixed(2)}
            </p>
            {/* Mobile remove (hidden on desktop) */}
            <button
              type="button"
              onClick={() => dispatch(removeFromCart(item.id))}
              className="md:hidden mt-1 text-[11px] text-red-500/90 hover:text-red-600 underline underline-offset-2"
              aria-label={`Remove ${name}`}
            >
              Remove
            </button>

          </div>

        </div>

        {/* Quantity + message stacked */}
        <div className="flex flex-col gap-1 mt-2">
          {/* Quantity Controls (with nudge) */}
          <motion.div
            animate={controls}
            className="flex items-center gap-2"
            aria-describedby={stockHelperId}
          >
            <button
              type="button"
              aria-label={`Decrease ${name} quantity`}
              onClick={() => dispatch(decrementQuantity(item.id))}
              disabled={item.quantity <= 1}
              className="px-2 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-[0.98]
                         focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60
                         disabled:opacity-50 disabled:cursor-not-allowed
                         dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
            >
              -
            </button>

            <span className="w-8 text-center">{item.quantity}</span>

            {/* SOFT disable at cap/out-of-stock so clicks still trigger nudge */}
            <button
              type="button"
              aria-label={`Increase ${name} quantity`}
              onClick={() => {
                if (!hasStockCap || item.quantity < stockNum) {
                  dispatch(incrementQuantity(item.id));
                } else {
                  nudge(); // gentle feedback instead of alert
                }
              }}
              aria-disabled={maxReached || !inStock}
              tabIndex={maxReached || !inStock ? -1 : 0}
              title={
                !inStock
                  ? "Out of stock"
                  : maxReached
                    ? "You’ve selected all available"
                    : undefined
              }
              className={`px-2 py-1 rounded bg-gray-200 text-gray-800 hover:bg-gray-300 active:scale-[0.98]
                          focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60
                          dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600
                          ${maxReached || !inStock ? "opacity-50 cursor-not-allowed" : ""}`}
            >
              +
            </button>
          </motion.div>

          {/* Friendly chip instead of red alert */}
          {hasStockCap && (
            <div className="mt-0.5">
              <motion.div
                key={inStock ? `rem-${remaining}` : "oos"}
                initial={{ opacity: 0, y: 2 }}
                animate={
                  remaining <= 2 && inStock
                    ? { opacity: [1, 0.78, 1] }
                    : { opacity: 1 }
                }
                transition={
                  remaining <= 2 && inStock
                    ? { duration: 1.8, repeat: Infinity }
                    : { duration: 0.15 }
                }
                className="inline-flex items-center gap-2 rounded-full
                           bg-amber-100/10 ring-1 ring-amber-300/30
                           px-2.5 py-1 backdrop-blur-sm"
                aria-live="polite"
                id={stockHelperId}
              >
                {/* pulse dot */}
                <span className="relative inline-flex h-1.5 w-1.5">
                  <span
                    className={`absolute inset-0 rounded-full ${inStock ? "bg-amber-400" : "bg-rose-400"
                      }`}
                  />
                  <span
                    className={`absolute inset-0 rounded-full ${inStock
                      ? "animate-ping opacity-[0.35] bg-amber-400"
                      : "animate-ping opacity-[0.35] bg-rose-400"
                      }`}
                  />
                </span>

                {/* animated copy */}
                <span className="text-[12px] font-medium tracking-wide">
                  <AnimatePresence mode="popLayout">
                    <motion.span
                      key={inStock ? `txt-${remaining}` : "soldout"}
                      initial={{ y: 6, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      exit={{ y: -6, opacity: 0 }}
                      transition={{ duration: 0.16 }}
                      className={`${inStock ? "text-amber-500/90" : "text-rose-400/90"
                        } tabular-nums`}
                    >
                      {inStock
                        ? remaining === 1
                          ? "Only 1 left"
                          : `${remaining} left in stock`
                        : "Sold out — more soon"}
                    </motion.span>
                  </AnimatePresence>
                </span>
              </motion.div>
            </div>
          )}
        </div>
      </div>

      {/* Right rail: description + close */}
      <div className="hidden md:flex items-start -ml-2.5 gap-2 min-w-[240px] max-w-sm">
        {/* description card (pulled slightly left with -ml-1) */}
        <div className="relative flex-1 pr-8">
          {desc ? (
            <>
              <div className="text-[11px] font-quicksand uppercase tracking-[0.12em] text-zinc-400 dark:text-zinc-500 mb-1">
                Details
              </div>
              <p className="font-merriweather text-[14px] leading-6 text-zinc-700 dark:text-zinc-300/90 line-clamp-5">
                {desc}
              </p>
              {/* soft bottom fade to hint overflow */}
              <div className="pointer-events-none absolute bottom-0 right-8 left-0 h-7 bg-gradient-to-t from-white/90 dark:from-zinc-900/90 to-transparent" />
            </>
          ) : (
            <p className="font-josefin text-sm text-gray-400 dark:text-gray-500 italic">
              No description
            </p>
          )}
        </div>

        {/* compact circular close button */}
        <button
          type="button"
          onClick={() => dispatch(removeFromCart(item.id))}
          aria-label="Remove item"
          className="shrink-0 rounded-full p-1.5 text-gray-400 hover:text-red-500 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition"
        >
          <XMarkIcon className="h-5 w-5" />
        </button>
      </div>

    </div >
  );
}

export default memo(CartItem);

