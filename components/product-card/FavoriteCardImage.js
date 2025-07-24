"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function FavoriteCardImage({
    product,
    fromCenter
}) {
    return (
        <motion.div
            id={`favorite-image-${product.id}`}
            className="relative w-full h-64 scroll-mt-[30vh]"
            initial={fromCenter ? { scale: 1 } : false}
            animate={fromCenter ? { scale: [1, 1.1, 1] } : false}
            transition={fromCenter ? { duration: 1.2, ease: "easeInOut" } : {}}
            whileHover={{ scale: 1.03 }}
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
    );
}
