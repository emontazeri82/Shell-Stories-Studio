// components/FavoriteCardInfo.js
// components/FavoriteCardInfo.js
"use client";

import { motion } from "framer-motion";

export default function FavoriteCardInfo({ product }) {
  return (
    <motion.div
      className="p-4 min-h-[100px] flex flex-col justify-between"
      initial={{ opacity: 0, y: 10 }}
      whileInView={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
      viewport={{ once: true, amount: 0.1 }}
    >
      <h2 className="text-lg font-playfair font-semibold text-gray-800 dark:text-gray-100 line-clamp-1">
        {product.name}
      </h2>
      <p className="text-inter text-indigo-600 dark:text-indigo-400 font-bold mt-2">
        {product.price != null ? `$${product.price.toFixed(2)}` : "Price not available"}
      </p>
    </motion.div>
  );
}


