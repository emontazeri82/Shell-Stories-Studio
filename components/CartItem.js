// components/CartItem — ULTRA CLEAN LUXURY + RESPONSIVE
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
import { motion, useAnimation } from "framer-motion";

function CartItem({ item }) {
  const dispatch = useDispatch();

  const product = useSelector((s) =>
    s.products?.items?.find((p) => p.id === item.id)
  );

  const name = product?.name ?? item.name;
  const price = Number(product?.price ?? item.price ?? 0);

  const stockNum = Number(product?.stock ?? item.stock ?? Infinity);
  const hasStockCap = Number.isFinite(stockNum);
  const remaining = Math.max(stockNum - item.quantity, 0);
  const inStock = remaining > 0;

  const controls = useAnimation();

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="
        relative 
        flex flex-col sm:flex-row
        gap-4 sm:gap-6 
        p-5 rounded-2xl
        bg-white/75 dark:bg-zinc-900/60
        border border-zinc-200/60 dark:border-zinc-800/60
        backdrop-blur-xl shadow-[0_4px_20px_rgba(0,0,0,0.05)]
        max-w-full
      "
    >
      {/* REMOVE BUTTON */}
      <button
        onClick={() => dispatch(removeFromCart(item.id))}
        className="
          absolute top-3 right-3 p-1.5 rounded-full
          hover:bg-zinc-200/50 dark:hover:bg-zinc-800 transition
        "
      >
        <XMarkIcon className="h-5 w-5 text-gray-400 hover:text-rose-500" />
      </button>

      {/* IMAGE */}
      <motion.div
        whileHover={{ scale: 1.03 }}
        transition={{ duration: 0.25 }}
        className="
          min-w-[120px] h-[120px] sm:min-w-[130px] sm:h-[130px]
          relative rounded-xl overflow-hidden
          shadow-[0_4px_14px_rgba(0,0,0,0.12)]
        "
      >
        <Image
          src={item.image_url}
          alt={name}
          fill
          sizes="140px"
          className="object-cover"
        />
      </motion.div>

      {/* MAIN CONTENT */}
      <div className="flex-1 min-w-0 flex flex-col justify-center">
        
        {/* NAME */}
        <h2 className="text-lg font-playfair text-gray-900 dark:text-gray-100 max-w-full">
          {name}
        </h2>

        {/* DESCRIPTION */}
        {item.description && (
          <p
            className="
              mt-1 text-[14px] leading-snug 
              text-gray-600 dark:text-gray-300
              line-clamp-2 sm:line-clamp-3 
              max-w-lg sm:max-w-2xl
            "
          >
            {item.description}
          </p>
        )}

        {/* PRICE */}
        <p className="mt-2 font-semibold text-gray-800 dark:text-gray-200">
          ${price.toFixed(2)}
        </p>

        {/* QTY + STOCK */}
        <div className="flex items-center gap-4 mt-3">
          {/* Quantity */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => dispatch(decrementQuantity(item.id))}
              disabled={item.quantity <= 1}
              className="
                px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700
                hover:bg-zinc-200 dark:hover:bg-zinc-600
                disabled:opacity-40 transition
              "
            >
              -
            </button>

            <span className="w-8 text-center font-medium">
              {item.quantity}
            </span>

            <button
              onClick={() => {
                if (item.quantity < stockNum) {
                  dispatch(incrementQuantity(item.id));
                } else {
                  controls.start({
                    x: [0, -4, 4, -2, 2, 0],
                    transition: { duration: 0.25 },
                  });
                }
              }}
              className="
                px-2 py-1 rounded-lg bg-zinc-100 dark:bg-zinc-700
                hover:bg-zinc-200 dark:hover:bg-zinc-600 transition
              "
            >
              +
            </button>
          </div>

          {/* Stock Badge */}
          {hasStockCap && (
            <span
              className="
                text-xs px-3 py-1 rounded-full
                bg-amber-100/40 text-amber-700
                ring-1 ring-amber-300/40
                whitespace-nowrap
              "
            >
              {inStock ? `${remaining} in stock` : "Sold out"}
            </span>
          )}
        </div>
      </div>
    </motion.div>
  );
}

export default memo(CartItem);

