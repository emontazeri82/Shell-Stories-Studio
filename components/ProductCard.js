// components/ProductCard.js
"use client";

import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useEffect, useState } from "react";
import FocusLock from "react-focus-lock";
import { useRouter } from "next/router";
import { useDispatch  } from "react-redux";
import { openCart } from "@/redux/slices/cartSlice";

export default function ProductModal({ product, onClose, onAddToCart }) {
    const [added, setAdded] = useState(false);
    const router = useRouter();
    const dispatch = useDispatch();
    // Allow closing on ESC key
    useEffect(() => {
        const handleEsc = (e) => {
            if (e.key === "Escape") onClose();
        };
        document.addEventListener("keydown", handleEsc);
        return () => document.removeEventListener("keydown", handleEsc);
    }, [onClose]);

    // Optional: prevent background scroll while modal is open
    useEffect(() => {
        document.body.style.overflow = "hidden";
        return () => {
            document.body.style.overflow = "auto";
        };
    }, []);

    const handleAddToCart = () => {
        onAddToCart();
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

    return (
        <AnimatePresence>
            {product && (
                <motion.div
                    className="fixed inset-0 z-50 bg-black/30 backdrop-blur-sm flex items-center justify-center px-4"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    aria-modal="true"
                    role="dialog"
                    aria-labelledby="product-title"
                >
                    <FocusLock>
                        <motion.div
                            initial={{ scale: 0.9, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.9, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="backdrop-blur-lg p-6 rounded-xl shadow-2xl max-w-3xl w-full grid grid-cols-1 md:grid-cols-2 gap-8 relative
                                    bg-white dark:bg-gray-900 text-gray-900 dark:text-gray-100"
                        >
                            <button
                                onClick={onClose}
                                className="absolute top-2 right-2 text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white text-xl"
                                aria-label="Close"
                            >
                                &times;
                            </button>

                            <div className="relative w-full aspect-square rounded-xl overflow-hidden shadow">
                                <Image
                                    src={product.image_url}
                                    alt={product.name}
                                    fill
                                    priority
                                    sizes="(min-width: 768px) 33vw, 100vw"
                                    className="object-cover"
                                />
                            </div>

                            <div className="font-poppins"> 
                                <h1 id="product-title" className="text-3xl font-bold text-gray-900 dark:text-white mb-2">{product.name}</h1>
                                <p className="text-xl text-indigo-600 font-semibold mb-4">
                                    ${product.price.toFixed(2)}
                                </p>
                                <p className="mb-6 text-gray-700 dark:text-gray-300">{product.description}</p>
                                {product.stock > 0 ? (
                                    <p className="mb-4 text-sm text-green-600 dark:text-green-400">
                                        In Stock: {product.stock} left
                                    </p>
                                ) : (
                                    <p className="mb-4 text-sm text-red-500 dark:text-red-400">
                                        Out of Stock
                                    </p>
                                )}

                                {!added ? (
                                    <button
                                        onClick={handleAddToCart}
                                        disabled={product.stock === 0}
                                        className="transition-transform hover:scale-105 active:scale-95
                                         bg-indigo-600 text-white px-6 py-2 rounded hover:bg-indigo-700 drak:bg-indigo-500 dark:hover:bg-indigo-500 transition disabled:opacity-50"
                                         autoFocus
                                    >
                                        Add to Cart
                                    </button>
                                ) : (
                                    <div className="flex flex-col gap-3 mt-4">
                                        <button
                                            onClick={handleGoToCart}
                                            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded"
                                        >
                                            🛒 Go to Cart
                                        </button>
                                        <button
                                            onClick={handleContinueShopping}
                                            className="bg-gray-200 hover:bg-gray-300 text-gray-800 px-4 py-2 rounded"
                                        >
                                            🛍️ Continue Shopping
                                        </button>
                                    </div>
                                )}
                            </div>
                        </motion.div>
                    </FocusLock>
                </motion.div>

            )}
        </AnimatePresence >
    );
}