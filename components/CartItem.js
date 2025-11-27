// components/CartItem.js — DIOR STYLE
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
  const price = Number(product?.price ?? item.price ?? 0);
  const stock = product?.stock ?? item.stock;

  const rawStock = Number(stock);
  const hasStockCap = Number.isFinite(rawStock);
  const stockNum = hasStockCap ? rawStock : Infinity;
  const inStock = stockNum > 0;
  const maxReached = hasStockCap && item.quantity >= stockNum;
  const remaining = hasStockCap ? Math.max(stockNum - item.quantity, 0) : null;

  const controls = useAnimation();
  const nudge = () =>
    controls.start({
      x: [0, -4, 4, -2, 2, 0],
      transition: { duration: 0.28 },
    });

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="group relative flex items-start gap-4 p-4 mb-4 rounded-xl
                 bg-white/70 backdrop-blur-sm
                 border border-black/5 shadow-[0_4px_18px_rgba(0,0,0,0.06)]
                 dark:bg-zinc-900/60 dark:border-white/10"
    >
      {/* PRODUCT IMAGE */}
      <div className="w-24 h-24 relative rounded-xl overflow-hidden shadow-[0_3px_12px_rgba(0,0,0,0.12)] ring-1 ring-black/5 dark:ring-white/10">
        <Image
          src={item.image_url}
          alt={name}
          fill
          sizes="96px"
          className="object-cover"
        />
      </div>

      {/* INFO SECTION */}
      <div className="flex-1">
        <h2 className="text-lg font-playfair tracking-tight text-gray-900 dark:text-gray-100">
          {name}
        </h2>

        <p className="text-sm font-inter text-gray-500 dark:text-gray-400 mt-0.5">
          ${price.toFixed(2)}
        </p>

        {/* QUANTITY */}
        <motion.div animate={controls} className="flex items-center gap-2 mt-3">
          <button
            onClick={() => dispatch(decrementQuantity(item.id))}
            disabled={item.quantity <= 1}
            className="px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700
                       text-gray-800 dark:text-gray-100
                       hover:bg-zinc-200 dark:hover:bg-zinc-600
                       disabled:opacity-50 disabled:cursor-not-allowed
                       transition-all"
          >
            -
          </button>

          <span className="w-8 text-center font-medium">{item.quantity}</span>

          <button
            onClick={() => {
              if (!hasStockCap || item.quantity < stockNum) {
                dispatch(incrementQuantity(item.id));
              } else {
                nudge();
              }
            }}
            className={`px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700
                        text-gray-800 dark:text-gray-100
                        hover:bg-zinc-200 dark:hover:bg-zinc-600 transition-all
                        ${maxReached || !inStock ? "opacity-50 cursor-not-allowed" : ""}`}
          >
            +
          </button>
        </motion.div>

        {/* STOCK STATUS */}
        {hasStockCap && (
          <div className="mt-2">
            <span
              className={`inline-block text-xs font-medium rounded-full px-3 py-1
                backdrop-blur-md
                ${
                  inStock
                    ? "bg-amber-100/20 text-amber-600 ring-1 ring-amber-300/40"
                    : "bg-rose-100/20 text-rose-600 ring-1 ring-rose-300/40"
                }`}
            >
              {inStock
                ? remaining === 1
                  ? "Only 1 left"
                  : `${remaining} in stock`
                : "Sold out — more soon"}
            </span>
          </div>
        )}
      </div>

      {/* REMOVE BUTTON */}
      <button
        onClick={() => dispatch(removeFromCart(item.id))}
        className="absolute top-3 right-3 p-1.5 rounded-full
                   hover:bg-zinc-100 dark:hover:bg-zinc-800 
                   transition"
      >
        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-rose-500" />
      </button>
    </motion.div>
  );
}

export default memo(CartItem);


