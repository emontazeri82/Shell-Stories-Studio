
"use client";

import { motion } from "framer-motion";
import Image from "next/image";

export default function WindowExpand({
  productId,
  src,
  delay = 0,
  size = 150,
  alt = "Favorite product",
}) {
  return (
    <motion.div
      initial={{ scale: 0, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{
        delay: delay / 1000,
        duration: 0.6,
        ease: "easeOut",
      }}
      className="relative z-20 rounded-full overflow-hidden shadow-xl backdrop-blur-md border border-white/20 hover:z-30"
      style={{
        width: `${size}px`,
        height: `${size}px`,
      }}
      aria-label={alt}
      role="img"
    >
      <Image
        src={src}
        alt={alt}
        fill
        priority
        className="object-cover w-full h-full rounded-full transition-transform duration-300 ease-out hover:scale-105"
        sizes="(max-width: 768px) 100px, (max-width: 1024px) 150px, 200px"
      />
    </motion.div>
  );
}








