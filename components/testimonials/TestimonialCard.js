"use client";

import Image from "next/image";
import { motion, useReducedMotion } from "framer-motion";

export default function TestimonialCard({ testimonial, index }) {
  const { name, role, location, quote, image } = testimonial;
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      initial={reduceMotion ? false : { opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.7,
        delay: index * 0.08,
        ease: [0.19, 1, 0.22, 1],
      }}
      className="
        relative rounded-3xl p-10
        bg-white/70 dark:bg-zinc-900/70
        backdrop-blur-xl
        border border-black/5 dark:border-white/10
        shadow-[0_20px_50px_rgba(0,0,0,0.08)]
        hover:shadow-[0_30px_80px_rgba(0,0,0,0.12)]
        hover:-translate-y-1
        transition-all duration-500
      "
    >
      {/* Decorative quote */}
      <div className="absolute -top-6 left-8 z-0 text-[120px] leading-none text-indigo-200/30 select-none font-playfair">
        “
      </div>

      <p className="relative z-10 font-playfair text-[18px] leading-relaxed text-zinc-800 dark:text-zinc-200 mb-8">
        {quote}
      </p>

      <div className="flex items-center gap-4">
        <div className="relative w-14 h-14 rounded-full overflow-hidden border border-black/10 dark:border-white/10">
          <Image
            src={image}
            alt={name}
            fill
            sizes="56px"
            className="object-cover"
          />
        </div>

        <div>
          <p className="font-semibold text-zinc-900 dark:text-white">
            {name}
          </p>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            {role} · {location}
          </p>
        </div>
      </div>
    </motion.div>
  );
}
