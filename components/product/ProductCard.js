"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import FocusLock from "react-focus-lock";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, openCart } from "@/redux/slices/cartSlice";
import { useClickOutside } from "../useClickOutside";
import ProductGallery from "@/components/product/ProductGallery";

function ProductModal({ product, onClose}) {
  if (!product) return null;

  const stockFont = "font-playfair";
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const modalRef = useRef(null);
  const dispatch = useDispatch();

  const cartItem = useSelector(
    (state) => state.cart.items.find((i) => i.id === product.id),
    (a, b) => a?.quantity === b?.quantity
  );

  useClickOutside(modalRef, onClose);

  useEffect(() => {
    setQuantity(cartItem ? cartItem.quantity : 1);
  }, [cartItem]);

  // Stock helpers
  const rawStock = Number(product.stock);
  const hasStockCap = Number.isFinite(rawStock);
  const stockNum = hasStockCap ? rawStock : Infinity;
  const inStock = stockNum > 0;
  const maxReached = quantity >= stockNum;

  const setSafe = (n) => {
    const next = Math.max(1, hasStockCap ? Math.min(n, stockNum) : n);
    setQuantity(next);
  };

  const controls = useAnimation();
  const nudge = async () => {
    await controls.start({
      x: [0, -4, 4, -2, 2, 0],
      transition: { duration: 0.28 },
    });
  };

  const handleIncrement = () => {
    if (!hasStockCap || quantity < stockNum) setSafe(quantity + 1);
    else nudge();
  };
  const handleDecrement = () => setSafe(quantity - 1);

  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  const handleAddToCart = () => {
    if (!inStock) return;
    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity,
        stock: product.stock,
      })
    );
    setAdded(true);
  };

  const handleContinueShopping = () => {
    setAdded(false);
    onClose();
  };

  const handleGoToCart = () => {
    dispatch(openCart());
    onClose();
  };

  const remaining = hasStockCap ? Math.max(stockNum - quantity, 0) : null;

  // Safe media fallback
  const galleryMedia =
    Array.isArray(product.media) && product.media.length
      ? product.media
      : product.image_url
        ? [{ id: "legacy", kind: "image", secure_url: product.image_url, public_id: "legacy" }]
        : [];

  return (
    <AnimatePresence>
      <motion.div
        key="modal-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.15 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/50 backdrop-blur-md"
        role="dialog"
        aria-modal="true"
      >
        <FocusLock returnFocus>
          <motion.div
            key="modal-content"
            ref={modalRef}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="relative grid grid-cols-1 md:grid-cols-2 max-w-3xl w-full gap-8 p-6 rounded-2xl
              shadow-2xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border border-gray-200/30 dark:border-gray-700/30
              overflow-hidden"
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl font-bold transition"
              aria-label="Close"
            >
              ×
            </button>

            {/* Gallery */}
            <div className="relative">
              <ProductGallery media={galleryMedia} productName={product.name} />
              <span
                className={`absolute top-3 left-3 text-white text-xs font-semibold px-3 py-1 rounded-full shadow
                  backdrop-blur-sm ring-1 ring-white/20
                  ${inStock ? "bg-emerald-600/90" : "bg-zinc-700/90"}`}
              >
                {inStock ? "In Stock" : "Out of Stock"}
              </span>
            </div>

            {/* Details */}
            <div className="font-poppins flex flex-col justify-between min-h-[340px]">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
                  {product.name}
                </h1>
                <p className="text-2xl font-extrabold mb-4 bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  ${Number(product.price || 0).toFixed(2)}
                </p>
                <p className="mb-6 text-gray-700 dark:text-gray-300 leading-relaxed">
                  {product.description}
                </p>
              </div>

              {/* Quantity */}
              <motion.div
                animate={controls}
                className="flex flex-col gap-1 mb-4"
                aria-describedby={hasStockCap ? "stock-helper" : undefined}
              >
                <div className="flex items-center gap-3">
                  <button
                    onClick={handleDecrement}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                               rounded-full font-bold text-lg transition disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={quantity <= 1}
                    aria-label="Decrease quantity"
                  >
                    −
                  </button>

                  <span className="text-xl font-semibold w-10 text-center">
                    {quantity}
                  </span>

                  <button
                    onClick={handleIncrement}
                    aria-disabled={maxReached || !inStock}
                    tabIndex={maxReached || !inStock ? -1 : 0}
                    title={
                      !inStock ? "Out of stock" : maxReached ? "You’ve selected all available" : undefined
                    }
                    className={`px-3 py-2 bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600 
                      rounded-full font-bold text-lg transition
                      ${maxReached || !inStock ? "opacity-50 cursor-not-allowed" : ""}`}
                    aria-label="Increase quantity"
                  >
                    +
                  </button>
                </div>

                {hasStockCap && (
                  <div className="mt-1">
                    <motion.div
                      key={inStock ? `rem-${remaining}` : "oos"}
                      initial={{ opacity: 0, y: 2 }}
                      animate={remaining <= 2 && inStock ? { opacity: [1, 0.78, 1] } : { opacity: 1 }}
                      transition={remaining <= 2 && inStock ? { duration: 1.8, repeat: Infinity } : { duration: 0.15 }}
                      className="inline-flex items-center gap-2 rounded-full
                        bg-amber-100/10 ring-1 ring-amber-300/30
                        px-2.5 py-1 backdrop-blur-sm"
                      aria-live="polite"
                      id="stock-helper"
                    >
                      <span className="relative inline-flex h-1.5 w-1.5">
                        <span className={`absolute inset-0 rounded-full ${inStock ? "bg-amber-400" : "bg-rose-400"}`} />
                        <span
                          className={`absolute inset-0 rounded-full ${inStock
                              ? "animate-ping opacity-[0.35] bg-amber-400"
                              : "animate-ping opacity-[0.35] bg-rose-400"
                            }`}
                        />
                      </span>
                      <span className={`${stockFont} text-[12px] font-medium tracking-wide`}>
                        <AnimatePresence mode="popLayout">
                          <motion.span
                            key={inStock ? `txt-${remaining}` : "soldout"}
                            initial={{ y: 6, opacity: 0 }}
                            animate={{ y: 0, opacity: 1 }}
                            exit={{ y: -6, opacity: 0 }}
                            transition={{ duration: 0.16 }}
                            className={`${inStock ? "text-amber-500/90" : "text-rose-400/90"} tabular-nums`}
                          >
                            {inStock
                              ? remaining === 1
                                ? "Only 1 left — almost gone"
                                : `${remaining} left in stock`
                              : "Sold out — more soon"}
                          </motion.span>
                        </AnimatePresence>
                      </span>
                    </motion.div>
                  </div>
                )}
              </motion.div>

              {/* CTA */}
              <motion.div className="mt-4 min-h-[90px] flex flex-col justify-center gap-3">
                <AnimatePresence mode="wait">
                  {!added ? (
                    <motion.button
                      key="add"
                      onClick={handleAddToCart}
                      disabled={!inStock}
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      whileTap={{ scale: 0.95 }}
                      className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-semibold transition-transform shadow-lg disabled:opacity-50"
                      autoFocus
                    >
                      🛒 Add to Cart
                    </motion.button>
                  ) : (
                    <motion.div
                      key="success"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.15 }}
                      className="flex flex-col gap-3"
                    >
                      <motion.button
                        onClick={handleGoToCart}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-transform shadow-lg"
                      >
                        ✅ Go to Cart
                      </motion.button>
                      <motion.button
                        onClick={handleContinueShopping}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                          text-gray-800 dark:text-gray-200 font-semibold transition-transform"
                      >
                        🛍️ Continue Shopping
                      </motion.button>
                    </motion.div>
                  )}
                </AnimatePresence>
              </motion.div>
            </div>
          </motion.div>
        </FocusLock>
      </motion.div>
    </AnimatePresence>
  );
}

export default memo(ProductModal);



