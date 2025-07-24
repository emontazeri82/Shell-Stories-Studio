// components/product-card/FavoriteCardWrapper.js
"use client";

import { motion } from "framer-motion";

export default function FavoriteCardWrapper({
  children,
  onClick,
  isHighlighted,
  productId,
  productName,
}) {
  return (
    <motion.div
      id={`favorite-${productId}`}
      onClick={() => onClick?.(productId)}
      tabIndex={0}
      role="button"
      aria-label={`View ${productName}`}
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: "easeOut" }}
      viewport={{ once: true, amount: 0.2 }}
      className={`group cursor-pointer bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-md
        hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-indigo-400 
        transform transition-transform duration-300 hover:scale-[1.03]
        ${isHighlighted ? "ring-2 ring-indigo-500" : ""}
      `}
    >
      {children}
    </motion.div>
  );
}
