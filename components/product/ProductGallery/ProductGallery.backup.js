"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import LazyVideo from "@/components/product/shared/LazyVideo";

/* ────────────────────────────────
   🔹 Cloudinary Transform Helpers
──────────────────────────────── */
function withCldParams(rawUrl, params, isVideo = false) {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!/res\.cloudinary\.com|cloudinary\.com/.test(u.hostname)) {
      console.warn("[withCldParams] ⚠️ Non-Cloudinary URL:", rawUrl);
      return rawUrl;
    }

    const parts = u.pathname.split("/upload/");
    if (parts.length !== 2) {
      console.warn("[withCldParams] ⚠️ Missing /upload/ in:", rawUrl);
      return rawUrl;
    }

    const transforms = isVideo
      ? "f_auto,vc_auto,q_auto:best,br_3m,w_1920,h_1080"
      : Array.isArray(params)
        ? params.join(",")
        : String(params);

    const transformed = `${u.origin}${parts[0]}/upload/${transforms}/${parts[1]}${u.search}`;
    console.debug("[withCldParams] ✅ Transformed:", transformed);
    return transformed;
  } catch (err) {
    console.error("[withCldParams] ❌ Error:", err);
    return rawUrl;
  }
}

/* ────────────────────────────────
   🔹 Safe Poster Generator (Fix for Blank Thumbnails)
──────────────────────────────── */
function buildSafePoster(url) {
  if (!url) return "/placeholder.png";

  try {
    const safeUrl = url.replace(/\.mov$/i, ".mp4");

    if (!/res\.cloudinary\.com|cloudinary\.com/.test(safeUrl)) {
      console.warn("[buildSafePoster] ⚠️ Non-Cloudinary URL:", safeUrl);
      return "/placeholder.png";
    }

    const parts = safeUrl.split("/upload/");
    if (parts.length !== 2) {
      console.warn("[buildSafePoster] ⚠️ Missing /upload/ in:", safeUrl);
      return "/placeholder.png";
    }

    // ✅ Correctly request poster from /video/upload/
    const posterUrl = `${parts[0]}/upload/so_2,f_jpg,q_auto:eco,c_fill,g_auto,w_480,h_270/${parts[1]}`
      .replace(/\.[^/.]+$/, ".jpg");

    console.debug("[buildSafePoster] ✅ Poster built:", posterUrl);
    return posterUrl;
  } catch (err) {
    console.error("[buildSafePoster] ❌ Error building poster:", err);
    return "/placeholder.png";
  }
}



/* ────────────────────────────────
   🔹 Normalize Media Items
──────────────────────────────── */
function normalizeItem(m) {
  const url = m?.url || m?.secure_url || m?.src || "";
  if (!url) {
    console.warn("[normalizeItem] ⚠️ Skipped media, no URL:", m);
    return null;
  }

  const safeUrl = url.replace(/\.mov$/i, ".mp4");
  const isVideo = /\.(mp4|webm|mkv)$/i.test(safeUrl);
  const isImage = /\.(jpe?g|png|webp|avif)$/i.test(safeUrl);

  const key =
    m?.public_id || m?.id || safeUrl || Math.random().toString(36).slice(2);

  const mainUrl = isImage
    ? withCldParams(safeUrl, [
      "f_auto",
      "q_auto:good",
      "c_fill,g_auto,w_1920,h_1080",
    ])
    : withCldParams(safeUrl, [], true);

  // ✅ NEW: use our safe poster builder
  const poster = isVideo
    ? buildSafePoster(safeUrl)
    : withCldParams(safeUrl, ["f_auto", "q_auto:low", "c_fill,w_300,h_200"]);

  console.groupCollapsed(`[normalizeItem:${isVideo ? "🎥" : "🖼️"}] ${key}`);
  console.info("📎 Original:", url);
  console.info("✅ Safe URL:", safeUrl);
  console.info("🎞 Type:", isVideo ? "Video" : "Image");
  console.info("🖼 Main URL:", mainUrl);
  console.info("🧩 Poster:", poster);
  console.groupEnd();


  return { key, url: safeUrl, type: isVideo ? "video" : "image", mainUrl, poster };
}

/* ────────────────────────────────
   🎨 ProductGallery Component
──────────────────────────────── */
export default function ProductGallery({ media = [], productName = "" }) {
  const items = useMemo(() => {
    if (!Array.isArray(media)) {
      console.error("[ProductGallery] ❌ media prop is not array:", media);
      return [];
    }
    const normalized = media.map(normalizeItem).filter(Boolean);
    console.log("[ProductGallery] ✅ Normalized Items Count:", normalized.length);
    return normalized;
  }, [media]);
  console.log("[ProductGallery] 🔄 useMemo recompute triggered, media length:", media?.length);


  const [active, setActive] = useState(0);

  useEffect(() => {
    if (active >= items.length) setActive(0);
  }, [items.length, active]);

  const activeItem = items[active];
  if (!activeItem) {
    console.warn("[ProductGallery] ⚠️ No active media item available.");
    return (
      <div className="aspect-video rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400">
        No media available
      </div>
    );
  }

  return (
    <div className="space-y-4 w-full max-w-5xl mx-auto">
      {/* ──────────────── Main Viewer ──────────────── */}
      <div className="relative aspect-[3/2] md:aspect-[16/9] rounded-xl overflow-hidden bg-black/10 dark:bg-zinc-800/40">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.key}
            initial={{ opacity: 0, scale: 1.02 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.98 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
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
                fill
                unoptimized
                sizes="(min-width: 1024px) 1000px, (min-width: 768px) 90vw, 100vw"
                className="object-cover"
                priority
                onError={() =>
                  console.error("[ProductGallery] ❌ Image failed:", activeItem.mainUrl)
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>
      {/* ──────────────── Thumbnails (Enhanced & Customizable) ──────────────── */}
      {items.length > 1 && (
        <div className="relative group">
          {/* Elegant gradient mask on right edge for smooth scroll */}
          {/* Gradient masks on both edges for elegant scroll reveal */}
          <div className="pointer-events-none absolute left-0 top-0 w-16 h-full bg-gradient-to-r from-white dark:from-zinc-900/95 to-transparent z-10" />
          <div className="pointer-events-none absolute right-0 top-0 w-16 h-full bg-gradient-to-l from-white dark:from-zinc-900/95 to-transparent z-10" />


          {/* Main scroll area */}
          <div
            className="flex gap-3 md:gap-4 overflow-x-auto px-4 pb-3 scroll-smooth
                 scrollbar-thin scrollbar-thumb-gray-400/40 scrollbar-track-transparent
                 hover:scrollbar-thumb-indigo-400/60 transition-all duration-500"
          >
            {items.map((t, i) => (
              <motion.button
                key={t.key}
                whileHover={{ scale: 1.06 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setActive(i)}
                type="button"
                className={`relative flex-shrink-0 overflow-hidden rounded-lg shadow-md 
            transition-all duration-300 ease-out backdrop-blur-sm
            ${i === active
                    ? "ring-2 ring-indigo-500 shadow-xl scale-[1.05]"
                    : "hover:ring-2 hover:ring-indigo-300/70 hover:shadow-lg"
                  }
          w-20 md:w-28 aspect-video bg-gradient-to-br from-zinc-100 via-zinc-200 to-zinc-300 
          dark:from-zinc-800 dark:via-zinc-700 dark:to-zinc-600`}
              >
                {/* ✅ Preserve your original logic — just enhance visuals */}
                {t.type === "video" ? (
                  <video
                    src={t.mainUrl || t.url}
                    className="w-full h-full object-cover transition-transform duration-500 hover:scale-110"
                    muted
                    preload="metadata"
                    poster={
                      t.poster && !t.poster.endsWith(".mp4")
                        ? t.poster
                        : "/placeholder.png"
                    }
                    onError={(e) => {
                      console.warn("[Thumbnail] ❌ Poster failed:", t.poster);
                      e.target.poster = "/placeholder.png";
                    }}
                  />
                ) : (
                  <Image
                    src={t.poster || "/placeholder.png"}
                    alt={`${t.type} thumbnail`}
                    fill
                    unoptimized
                    sizes="180px"
                    className="object-cover transition-transform duration-500 hover:scale-110"
                  />
                )}

                {/* Soft overlay for hover depth */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 via-transparent to-transparent opacity-0 group-hover:opacity-50 transition-opacity duration-300" />

                {/* ✨ Smooth video play icon overlay */}
                {t.type === "video" && (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="bg-white/20 backdrop-blur-md rounded-full p-2 transition-transform duration-300 hover:scale-110">
                      <svg
                        xmlns="http://www.w3.org/2000/svg"
                        fill="white"
                        viewBox="0 0 24 24"
                        className="w-5 h-5 drop-shadow-md"
                      >
                        <path d="M8 5v14l11-7z" />
                      </svg>
                    </div>
                  </div>
                )}
              </motion.button>
            ))}
          </div>

          {/* Subtle scroll indicator dots below carousel */}
          <div className="flex justify-center gap-1 mt-2">
            {items.slice(0, 6).map((_, i) => (
              <div
                key={i}
                className={`h-1.5 w-4 rounded-full transition-all duration-300 ${i === active
                  ? "bg-indigo-500 w-6"
                  : "bg-gray-300 dark:bg-zinc-600 hover:bg-gray-400"
                  }`}
              ></div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
