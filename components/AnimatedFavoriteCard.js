"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import Image from "next/image";

export default function AnimatedFavoriteCard({
  src,
  productId,
  delay = 0,
  x = 50,
  y = 50,
  fromCenter = false,
  children, // 👈 add this
}) {
  const initial = fromCenter
    ? { top: "50vh", left: "50vw", opacity: 0 }
    : { opacity: 0, y: 40 };

  const animate = fromCenter
    ? {
        top: `${y}vh`,
        left: `${x}vw`,
        opacity: 1,
        transition: {
          delay: delay / 1000,
          duration: 0.6,
          ease: "easeOut",
        },
      }
    : {
        opacity: 1,
        y: 0,
        transition: {
          delay: delay / 1000,
          duration: 0.6,
        },
      };

  // ✅ If used as wrapper (in ProductFavorite), return animated wrapper around children
  if (children) {
    return (
      <motion.div
        initial={initial}
        animate={animate}
        viewport={{ once: true, amount: 0.1 }}
      >
        {children}
      </motion.div>
    );
  }

  // ✅ Otherwise, behave like a floating favorite image
  return (
    <motion.div
      initial={initial}
      animate={animate}
      className="absolute w-32 h-32 md:w-40 md:h-40 lg:w-48 lg:h-48 pointer-events-auto"
      style={{
        transform: "translate(-50%, -50%)",
      }}
    >
      <Link
        href={`/products#favorite-${productId}`}
        scroll={true}
        aria-label={`Scroll to favorite product ${productId}`}
      >
        <Image
          src={src}
          alt={`Favorite product ${productId}`}
          fill
          className="object-cover rounded-xl shadow-lg hover:scale-105 transition-transform duration-300"
          sizes="(max-width: 768px) 100px, 200px"
          priority
        />
      </Link>
    </motion.div>
  );
}



