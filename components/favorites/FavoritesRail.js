// components/favorites/FavoritesRail.jsx
"use client";

import { memo } from "react";
import { SparklesIcon } from "@heroicons/react/24/outline";
import { motion, AnimatePresence } from "framer-motion";
import FavoriteCard from "./FavoriteCard";
import FavoritesSkeleton from "./FavoritesSkeleton";
import { useFavoritesRail } from "@/hooks/useFavoriteRail";

function FavoritesRail() {
  const { loading, visible, toast, setToast, addAndReplace } = useFavoritesRail();

  if (!loading && visible.length === 0 && !toast) return null;
  {!loading && visible.length < 6 && (
    <FavoritesSkeleton count={6 - visible.length} />
  )}
  

  return (
    <div className="mt-6">
      <div className="mb-2 flex items-center gap-2">
        <SparklesIcon className="h-5 w-5 text-fuchsia-500" />
        <h3 className="text-sm font-semibold">You may also like</h3>
      </div>

      <motion.div
        layout
        className="flex gap-3 overflow-x-auto snap-x snap-mandatory pb-2 [-ms-overflow-style:none] [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {loading && <FavoritesSkeleton count={4} />}
        <AnimatePresence initial={false}>
          {!loading &&
            visible.map((p, i) => (
              <FavoriteCard
                key={p.id}
                product={p}
                onAdd={() => addAndReplace(p, i)}
              />
            ))}
        </AnimatePresence>
      </motion.div>

      <AnimatePresence>
        {toast && (
          <motion.div
            key="toast"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            transition={{ duration: 0.16 }}
            role="status"
            aria-live="polite"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 text-emerald-700 px-3 py-1.5 text-xs ring-1 ring-emerald-200 dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/30"
          >
            ✅ Added <span className="font-semibold">{toast.name}</span> to cart
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default memo(FavoritesRail);
