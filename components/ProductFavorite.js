// components/ProductFavorite.js
"use client";

import { Element } from "react-scroll";
import { motion } from "framer-motion";
import Image from "next/image";
import AnimatedFavoriteCard from "./AnimatedFavoriteCard";

export default function ProductFavorite({
    product,
    onClick,
    isHighlighted,
    fromCenter,
}) {
    return (
        <Element name={`favorite-${product.id}`}>
            <AnimatedFavoriteCard
                productId={product.id}
                fromCenter={fromCenter} // ✅ animate from center if triggered
            >
                <motion.div
                    id={`favorite-${product.id}`}
                    onClick={() => {
                        if (product?.id) {
                            onClick(product.id);
                        }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-label={`View ${product.name}`}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.4, ease: "easeOut" }}
                    viewport={{ once: true, amount: 0.1 }}
                    className={`cursor-pointer bg-white dark:bg-gray-800 rounded-xl overflow-hidden shadow 
                    hover:shadow-lg transition-transform transform hover:scale-[1.015] 
                    ${isHighlighted ? "ring-2 ring-indigo-500" : ""}`}
                >
                    {/* ✅ Wrapper for scroll target and image animation */}
                    <motion.div
                        id={`favorite-image-${product.id}`}
                        className="relative w-full h-64 scroll-mt-[30vh]"
                        initial={fromCenter ? { scale: 1 } : false}
                        animate={fromCenter ? { scale: [1, 1.1, 1] } : false}
                        transition={fromCenter ? { duration: 1.2, ease: "easeInOut" } : {}}
                    >
                        <Image
                            src={product.image_url}
                            alt={product.name}
                            fill
                            sizes="(min-width: 768px) 33vw, 100vw"
                            loading="lazy"
                            className="object-cover"
                        />
                    </motion.div>

                    {/* Product Info */}
                    <div className="p-4">
                        <h2 className="text-lg font-semibold text-gray-800 dark:text-gray-100">
                            {product.name}
                        </h2>
                        <p className="text-indigo-600 dark:text-indigo-400 font-bold mt-1">
                            {product.price != null ? `$${product.price.toFixed(2)}` : "Price not availalbe"}
                        </p>
                    </div>
                </motion.div>

            </AnimatedFavoriteCard>
        </Element>
    );
}



