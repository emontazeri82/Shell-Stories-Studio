// components/CartPanel.js
"use client";

import { useSelector, useDispatch } from "react-redux";
import { motion, AnimatePresence } from "framer-motion";
import CartItem from "./CartItem";
import { useRef, useEffect} from "react";
import { usePersistentCart } from "./usePersistentCart";
import { useClickOutside } from "./useClickOutside";
import CartSummary from "./CartSummary";

export default function CartPanel({ isOpen, onClose }) {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);
  const total = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const closeBtnRef = useRef();
  const panelRef = useRef();

  useEffect(() => {
    if (isOpen) {
        closeBtnRef.current?.focus();
    }
  }, [isOpen]);

  useClickOutside(panelRef, onClose);
  usePersistentCart();


  return (
    <AnimatePresence>
      {isOpen && (
        <motion.aside
          ref={panelRef}
          className="fixed top-0 right-0 h-full w-full sm:w-[400px] bg-white dark:bg-gray-900 text-gray-800 dark:text-gray-100 shadow-2xl z-50 overflow-y-auto"
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "tween", duration: 0.3 }}
          drag="x"
          dragConstraints={{ left: 0, right: 0 }}
          onDragEnd={(e, info) => {
            if (info.offset.x > 100) {
                onClose();
            }
          }}
        >
          <div className="p-4 border-b dark:border-gray-700 flex justify-between items-center">
            <h2 className="text-xl font-bold font-title">Your Cart</h2>
            <button 
                ref = {closeBtnRef}
                onClick={onClose} 
                className="text-gray-500 hover:text-gray-700 dark:text-gray-300 drak:hover:text-white text-2xl font-poppins"
                aria-label="Close Cart"
            >
                &times;
            </button>
          </div>

          <div className="flex flex-col h-full">
            {/* Cart Items */}
            <div className="flex-1 overflow-y-auto px-4 pt-4">
                {items.length === 0 ? (
                    <p className="text-center text-gray-500 dark:text-gray-400 font-inter">Your cart is empty.</p>
                ): (
                    items.map((item) => (
                        <CartItem key={item.id} item={item} />
                    ))
                )}
            </div>
        
            {items.length > 0 && (
                <div className="sticky bottom-0 bg-white dark:bg-gray-900 border-t dark:border-gray-700 px-4 py-3 shadow-inner z-10">
                    <CartSummary />
                </div>               
            )}
          </div>
        </motion.aside>
      )}
    </AnimatePresence>
  );
}


