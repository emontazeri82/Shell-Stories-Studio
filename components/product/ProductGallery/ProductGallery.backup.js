"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import LazyVideo from "@/components/product/shared/LazyVideo";

/* ─────────────── Cloudinary Helpers ─────────────── */
function withCldParams(rawUrl, params, isVideo = false) {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!/res\.cloudinary\.com|cloudinary\.com/.test(u.hostname)) return rawUrl;
    const parts = u.pathname.split("/upload/");
    if (parts.length !== 2) return rawUrl;
    const transforms = isVideo
      ? "f_auto,vc_auto,q_auto:best,br_3m,w_1920,h_1080"
      : Array.isArray(params)
      ? params.join(",")
      : String(params);
    return `${u.origin}${parts[0]}/upload/${transforms}/${parts[1]}${u.search}`;
  } catch {
    return rawUrl;
  }
}

function buildSafePoster(url) {
  if (!url) return "/placeholder.png";
  try {
    const safeUrl = url.replace(/\.mov$/i, ".mp4");
    const parts = safeUrl.split("/upload/");
    if (parts.length !== 2) return "/placeholder.png";
    return `${parts[0]}/upload/so_2,f_jpg,q_auto:eco,c_fill,g_auto,w_480,h_270/${parts[1]}`.replace(
      /\.[^/.]+$/,
      ".jpg"
    );
  } catch {
    return "/placeholder.png";
  }
}

function normalizeItem(m) {
  const url = m?.url || m?.secure_url || m?.src || "";
  if (!url) return null;
  const safeUrl = url.replace(/\.mov$/i, ".mp4");
  const isVideo = /\.(mp4|webm|mkv)$/i.test(safeUrl);
  const key = `${m?.public_id || safeUrl}-${m?.kind || m?.type || "media"}`;
  const mainUrl = isVideo
    ? withCldParams(safeUrl, [], true)
    : withCldParams(safeUrl, ["f_auto", "q_auto:good", "c_fill,g_auto"]);
  const poster = isVideo
    ? buildSafePoster(safeUrl)
    : withCldParams(safeUrl, ["f_auto", "q_auto:low", "c_fill"]);
  return { key, url: safeUrl, type: isVideo ? "video" : "image", mainUrl, poster };
}

/* ─────────────── ProductGallery ─────────────── */
export default function ProductGallery({ media = [], productName = "" }) {
  const items = useMemo(
    () => (Array.isArray(media) ? media.map(normalizeItem).filter(Boolean) : []),
    [media]
  );
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [items.length, active]);

  const activeItem = items[active];
  if (!activeItem) {
    return (
      <div className="aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
        No media available
      </div>
    );
  }

  // 🌀 Autoplay logic — pauses when hovered
  useEffect(() => {
    if (!isHovered && items.length > 1) {
      const timer = setInterval(() => {
        setActive((prev) => (prev + 1) % items.length);
      }, 5000);
      return () => clearInterval(timer);
    }
  }, [items.length, isHovered]);

  return (
    <div className="relative flex flex-col items-center space-y-6 w-full max-w-6xl mx-auto">
      {/* 🌟 Main Viewer */}
      <div
        className="relative w-full rounded-2xl overflow-hidden
        bg-gradient-to-br from-zinc-100/20 via-zinc-200/10 to-zinc-100/20
        dark:from-zinc-800/70 dark:via-zinc-700/60 dark:to-zinc-800/70
        shadow-[0_4px_50px_rgba(0,0,0,0.25)] hover:shadow-[0_4px_70px_rgba(0,0,0,0.45)]
        transition-all duration-700 group cursor-grab active:cursor-grabbing"
        style={{ aspectRatio: "16/9" }}
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.key}
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6, ease: "easeInOut" }}
            className="absolute inset-0"
          >
            {activeItem.type === "video" ? (
              <LazyVideo
                src={activeItem.mainUrl || activeItem.url}
                poster={activeItem.poster}
                autoPlay={false}
              />
            ) : (
              <Image
                src={activeItem.mainUrl}
                alt={`${productName || "Product"} image`}
                unoptimized
                fill
                className="object-cover object-center absolute inset-0 rounded-2xl"
              />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Buttons */}
        <button
          onClick={() =>
            setActive((prev) => (prev - 1 + items.length) % items.length)
          }
          className="absolute left-4 top-1/2 -translate-y-1/2 text-4xl text-white/80 hover:text-white z-20"
        >
          ‹
        </button>
        <button
          onClick={() => setActive((prev) => (prev + 1) % items.length)}
          className="absolute right-4 top-1/2 -translate-y-1/2 text-4xl text-white/80 hover:text-white z-20"
        >
          ›
        </button>
      </div>

      {/* Thumbnails */}
      {items.length > 1 && (
        <div className="flex justify-center flex-wrap gap-4 md:gap-6 mt-4">
          {items.map((t, i) => (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => setActive(i)}
              type="button"
              className={`relative overflow-hidden rounded-xl p-1.5 transition-all duration-300 ease-out ${
                i === active
                  ? "ring-2 ring-fuchsia-400 shadow-[0_0_25px_rgba(240,100,255,0.45)] bg-gradient-to-br from-indigo-700/60 to-fuchsia-700/50 scale-105"
                  : "hover:ring-1 hover:ring-indigo-300/70 hover:shadow-[0_0_20px_rgba(160,120,255,0.3)] bg-gradient-to-br from-zinc-800/70 to-zinc-900/60 hover:scale-[1.05]"
              } w-20 h-16 md:w-24 md:h-20 flex items-center justify-center backdrop-blur-sm`}
            >
              {t.type === "video" ? (
                <video
                  src={t.mainUrl || t.url}
                  muted
                  preload="metadata"
                  poster={t.poster}
                  className="object-cover rounded-lg"
                />
              ) : (
                <Image
                  src={t.poster || "/placeholder.png"}
                  alt={`${t.type} thumbnail`}
                  width={96}
                  height={72}
                  unoptimized
                  className="object-cover rounded-lg"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}