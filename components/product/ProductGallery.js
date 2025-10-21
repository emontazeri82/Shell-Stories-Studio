"use client";

import { useState, useMemo } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

export default function ProductGallery({ media = [], productName = "" }) {
  const items = Array.isArray(media) ? media : [];
  const [active, setActive] = useState(0);

  const activeItem = items[active];

  const thumbs = useMemo(
    () =>
      items.map((m) => ({
        key: m.id ?? m.public_id ?? m.secure_url,
        kind: m.kind,
        url: m.secure_url,
      })),
    [items]
  );

  if (!activeItem) {
    return (
      <div className="relative aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800" />
    );
  }

  return (
    <div className="space-y-3">
      {/* Main */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-black/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.secure_url}
            initial={{ opacity: 0.0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {activeItem.kind === "video" ? (
              <video
                src={activeItem.secure_url}
                className="h-full w-full object-cover"
                controls
                playsInline
              />
            ) : (
              <Image
                src={activeItem.secure_url}
                alt={`${productName} image`}
                fill
                sizes="(min-width: 768px) 40vw, 100vw"
                className="object-cover"
                priority
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Thumbs */}
      {thumbs.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {thumbs.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square rounded-lg overflow-hidden ring-1 ring-black/5
                ${i === active ? "ring-2 ring-indigo-500" : ""}
              `}
              aria-label={`Show ${t.kind}`}
            >
              {t.kind === "video" ? (
                <video src={t.url} className="h-full w-full object-cover" />
              ) : (
                <Image
                  src={t.url}
                  alt="thumbnail"
                  fill
                  className="object-cover"
                  sizes="120px"
                />
              )}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

