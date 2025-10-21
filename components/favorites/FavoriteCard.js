// components/favorites/FavoriteCard.jsx
"use client";
import Image from "next/image";
import { memo } from "react";
import { motion, useReducedMotion } from "framer-motion";

function FavoriteCard({ product, onAdd }) {
  const prefersReducedMotion = useReducedMotion();
  const p = product;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.96, y: prefersReducedMotion ? 0 : 6 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96, y: prefersReducedMotion ? 0 : 6 }}
      transition={{ duration: 0.18 }}
      className="snap-start min-w-[220px] rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/60 p-3 backdrop-blur"
    >
      <div className="relative h-28 w-full overflow-hidden rounded-lg bg-gradient-to-br from-indigo-500/10 to-fuchsia-500/10">
        {p.image_url && (
          <Image src={p.image_url} alt={p.name} fill sizes="220px" className="object-cover" />
        )}
        <span className="absolute top-2 left-2 text-[10px] font-semibold px-2 py-0.5 rounded-full ring-1 ring-white/20 bg-emerald-600/90 text-white">
          In stock
        </span>
      </div>
      <div className="mt-3 text-sm font-medium line-clamp-2">{p.name}</div>
      <div className="text-xs text-zinc-500">${Number(p.price || 0).toFixed(2)}</div>
      <button
        onClick={onAdd}
        aria-label={`Add ${p.name} to cart`}
        className="mt-2 w-full rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 py-1.5 text-sm font-semibold hover:opacity-90 transition"
      >
        Add
      </button>
    </motion.div>
  );
}

export default memo(FavoriteCard);
