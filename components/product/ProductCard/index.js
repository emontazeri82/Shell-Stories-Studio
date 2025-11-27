"use client";

import { motion, AnimatePresence, useAnimation } from "framer-motion";
import { memo, useEffect, useRef, useState } from "react";
import FocusLock from "react-focus-lock";
import { useDispatch, useSelector } from "react-redux";
import { addToCart, openCart } from "@/redux/slices/cartSlice";
import { useClickOutside } from "@/components/useClickOutside";
import ProductGalleryDebug from "../ProductGallery";

// ────────────────────────────────
// 💫 Additional Global Enhancements
// ────────────────────────────────
const gradientAnimationCSS = `
@keyframes gradient-x {
  0%, 100% { background-position: 0% center; }
  50% { background-position: 100% center; }
}
.animate-gradient-x {
  animation: gradient-x 6s ease infinite;
}

@keyframes shadowPulse {
  0%, 100% { box-shadow: 0 4px 40px rgba(0,0,0,0.3); }
  50% { box-shadow: 0 4px 55px rgba(0,0,0,0.45); }
}
.shadow-breath {
  animation: shadowPulse 6s ease-in-out infinite;
}
`;

// Inject once into the document head
if (typeof window !== "undefined" && !document.getElementById("boutique-styles")) {
  const style = document.createElement("style");
  style.id = "boutique-styles";
  style.innerHTML = gradientAnimationCSS;
  document.head.appendChild(style);
}

function ProductCard({ product, onClose }) {
  // ────────────────────────────────
  // Safety checks
  // ────────────────────────────────
  if (!product) {
    console.warn("[ProductCard] ⚠️ No product provided");
    return null;
  }
  console.log("🔎 [ProductCard] FULL PRODUCT:", product);
  console.log("🔎 product.id:", product.id);
  console.log("🔎 product.name:", product.name);
  console.log("🔎 product.description:", product.description);


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

  // ────────────────────────────────
  // Stock logic
  // ────────────────────────────────
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

  // ────────────────────────────────
  // Close on ESC
  // ────────────────────────────────
  useEffect(() => {
    const handleEsc = (e) => e.key === "Escape" && onClose?.();
    document.addEventListener("keydown", handleEsc);
    return () => document.removeEventListener("keydown", handleEsc);
  }, [onClose]);

  // ────────────────────────────────
  // Cart handlers
  // ────────────────────────────────
  const handleAddToCart = () => {
    if (!inStock) return;
    console.log("[ProductCard] 🛒 Adding to cart:", product.name, "qty:", quantity);

    dispatch(
      addToCart({
        id: product.id,
        name: product.name,
        price: product.price,
        image_url: product.image_url,
        quantity,
        stock: product.stock,
        description: product.description,   // ← FIXED
        category: product.category,         // (optional but recommended)
      })
    );
    setAdded(true);
  };

  const handleContinueShopping = () => {
    setAdded(false);
    onClose?.();
  };

  const handleGoToCart = () => {
    dispatch(openCart());
    onClose?.();
  };

  const remaining = hasStockCap ? Math.max(stockNum - quantity, 0) : null;

  // ────────────────────────────────
  // Safe media fallback for gallery
  // ────────────────────────────────
  const galleryMedia =
    Array.isArray(product.media) && product.media.length
      ? product.media
      : product.image_url
        ? [{ id: "legacy", kind: "image", secure_url: product.image_url, public_id: "legacy" }]
        : [];

  // ────────────────────────────────
  // Render
  // ────────────────────────────────
  return (
    <AnimatePresence>
      <motion.div
        key="modal-bg"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.25 }}
        className="fixed inset-0 z-50 flex items-center justify-center px-4 bg-black/60 
           backdrop-blur-md backdrop-saturate-150 
           bg-[radial-gradient(ellipse_at_top,rgba(17,17,17,0.7),rgba(0,0,0,0.9))]"
        role="dialog"
        aria-modal="true"
        onMouseMove={(e) => {
          const x = (e.clientX / window.innerWidth - 0.5) * 8;
          const y = (e.clientY / window.innerHeight - 0.5) * 8;
          e.currentTarget.style.backgroundPosition = `${50 + x}% ${50 + y}%`;
        }}
        style={{
          backgroundSize: "200% 200%",
          backgroundImage:
            "radial-gradient(ellipse at top, rgba(17,17,17,0.7), rgba(0,0,0,0.9))",
        }}
      >
        <FocusLock returnFocus>
          <motion.div
            key="modal-content"
            ref={modalRef}
            initial={{ opacity: 0, y: 20, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.97 }}
            transition={{ type: "spring", stiffness: 220, damping: 20 }}
            className="
              relative grid grid-cols-1 md:grid-cols-2 max-w-5xl w-full gap-8 p-6 rounded-2xl 
              luxury-product-bg shadow-breath transition-all duration-500
            "
          >
            {/* ✨ ADD THIS LINE HERE — FIRST CHILD */}
            <div className="luxury-shimmer"></div>
            {/* Close button */}
            <button
              onClick={onClose}
              className="absolute top-3 right-3 text-gray-400 hover:text-gray-800 dark:hover:text-white text-2xl font-bold transition"
              aria-label="Close"
            >
              ×
            </button>

            <div
              className="relative rounded-2xl overflow-hidden
                  bg-gradient-to-b from-transparent via-transparent to-transparent
                  shadow-[0_10px_45px_rgba(0,0,0,0.35)]
                  hover:shadow-[0_14px_55px_rgba(0,0,0,0.5)]
                  transition-all duration-700 ease-out
                  flex items-center justify-center
                  backdrop-blur-[2px]"
              style={{
                aspectRatio: "1 / 1",             // ✅ Clean square balance
                width: "100%",                    // ✅ Scales perfectly
                maxWidth: "700px",                // ✅ Keeps layout consistent
                maxHeight: "550px",               // ✅ Soft upper limit, not forced
                lineHeight: 0,                    // ✅ Removes slim bar gap
                backgroundColor: "transparent",   // ✅ Full media visibility
                maskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)",
                WebkitMaskImage:
                  "radial-gradient(circle at center, rgba(0,0,0,1) 85%, rgba(0,0,0,0) 100%)",
                border: "1px solid rgba(255,255,255,0.08)", // ✅ Subtle elegant edge
              }}
            >˝
              <ProductGalleryDebug media={galleryMedia} productName={product.name} />
              <span
                className={`absolute top-4 left-4 text-[13px] font-semibold tracking-wide select-none
                  ${inStock
                    ? "text-emerald-400 drop-shadow-[0_0_6px_rgba(16,185,129,0.8)]"
                    : "text-gray-300 drop-shadow-[0_0_6px_rgba(255,255,255,0.6)]"
                  }`}
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

              {/* Quantity controls */}
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
                      <span className="font-playfair text-[12px] font-medium tracking-wide">
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

              {/* CTA Section */}
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
                      className="px-6 py-3 rounded-xl bg-gradient-to-r from-indigo-600 via-purple-600 to-indigo-600 bg-[length:200%_auto] animate-gradient-x text-white font-semibold transition-transform shadow-lg hover:shadow-xl hover:-translate-y-0.5 disabled:opacity-50"
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
                        className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-700 text-white font-semibold transition-transform shadow-md hover:shadow-lg hover:-translate-y-0.5"
                      >
                        ✅ Go to Cart
                      </motion.button>
                      <motion.button
                        onClick={handleContinueShopping}
                        whileTap={{ scale: 0.95 }}
                        className="px-6 py-3 rounded-xl bg-gray-200 hover:bg-gray-300 dark:bg-gray-700 dark:hover:bg-gray-600
                          text-gray-800 dark:text-gray-200 font-semibold transition-all shadow-md hover:shadow-lg hover:-translate-y-0.5"
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

export default memo(ProductCard);




