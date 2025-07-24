"use client";

import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useDispatch } from "react-redux";
import { openCart } from "@/redux/slices/cartSlice";
import ThemeToggle from "./ThemeToggle";

export default function MobileMenu({ isOpen, setIsOpen, totalQuantity }) {
  const dispatch = useDispatch();

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Optional background dim */}
          <motion.div
            className="fixed inset-0 bg-black/30 z-40"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
          />

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="fixed top-20 right-4 w-64 bg-white dark:bg-gray-900 rounded-xl shadow-xl z-50 p-4 border border-gray-200 dark:border-gray-800"
          >
            {/* Close Button */}
            <button
              onClick={() => setIsOpen(false)}
              className="absolute top-2 right-2 text-gray-500 hover:text-red-500"
              aria-label="Close Menu"
            >
              ❌
            </button>

            <div className="mt-6 flex flex-col gap-3">
              <ThemeToggle />

              <Link
                href="/"
                className="font-poppins text-gray-700 hover:text-indigo-600"
                onClick={() => setIsOpen(false)}
              >
                🏠 Home
              </Link>
              <Link
                href="/products"
                className="font-poppins text-gray-700 hover:text-indigo-600"
                onClick={() => setIsOpen(false)}
              >
                🐚 Products
              </Link>
              <Link
                href="/about"
                className="font-poppins text-gray-700 hover:text-indigo-600"
                onClick={() => setIsOpen(false)}
              >
                ℹ️ About
              </Link>
              <Link
                href="/contact"
                className="font-poppins text-gray-700 hover:text-indigo-600"
                onClick={() => setIsOpen(false)}
              >
                📞 Contact
              </Link>
              <button
                onClick={() => {
                  dispatch(openCart());
                  setIsOpen(false);
                }}
                className="text-left font-poppins text-gray-700 hover:text-indigo-600"
              >
                🛒 Cart ({totalQuantity})
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}


