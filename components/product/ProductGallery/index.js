"use client";

import { useState, useMemo, useEffect } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";

/* ─────────────────────────────────────────────
   🔹 Split a URL safely into { base, query }
────────────────────────────────────────────── */
function splitQuery(rawUrl) {
  try {
    const u = new URL(rawUrl);
    const base = `${u.origin}${u.pathname}`;
    const query = u.search || "";
    return { base, query };
  } catch {
    return { base: rawUrl || "", query: "" };
  }
}

/* ─────────────────────────────────────────────
   🔹 Insert Cloudinary transforms after `/upload/`
────────────────────────────────────────────── */
function withCldParams(rawUrl, params) {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!/res\.cloudinary\.com|cloudinary\.com/.test(u.hostname)) return rawUrl;

    const parts = u.pathname.split("/upload/");
    if (parts.length !== 2) return rawUrl;

    const transforms = Array.isArray(params) ? params.join(",") : String(params);
    u.pathname = `${parts[0]}/upload/${transforms}/${parts[1]}`;
    return `${u.origin}${u.pathname}${u.search}`;
  } catch {
    return rawUrl;
  }
}

/* ─────────────────────────────────────────────
   🔹 Generate Cloudinary video poster (frame grab)
────────────────────────────────────────────── */
function makeCldPoster(rawUrl) {
  if (!rawUrl) return null;
  try {
    const u = new URL(rawUrl);
    if (!/res\.cloudinary\.com|cloudinary\.com/.test(u.hostname)) return null;

    const parts = u.pathname.split("/upload/");
    if (parts.length !== 2) return null;

    const transformed = `${parts[0]}/upload/so_1/${parts[1]}`;
    const jpgPath = transformed.replace(/(\.[a-z0-9]+)$/i, ".jpg");
    return `${u.origin}${jpgPath}${u.search}`;
  } catch {
    return null;
  }
}

/* ─────────────────────────────────────────────
   🔹 Normalize media objects into unified format
────────────────────────────────────────────── */
function normalizeItem(m) {
  const url = m?.url || m?.secure_url || m?.src || "";
  const typeRaw = m?.resourceType || m?.resource_type || m?.kind || "";
  const type = String(typeRaw).toLowerCase();
  const isVideo = type === "video";
  const isImage = type === "image" || (!isVideo && url && !url.endsWith(".mp4"));

  const key =
    m?.publicId ||
    m?.public_id ||
    m?.id ||
    url ||
    Math.random().toString(36).slice(2);

  const mainImage = isImage
    ? withCldParams(url, ["f_auto", "q_auto", "c_fill", "w_1200", "h_1200"])
    : null;

  const thumb = withCldParams(url, ["f_auto", "q_auto", "c_fill", "w_180", "h_180"]);
  const poster = isVideo ? makeCldPoster(url) : null;

  return { key, url, type: isVideo ? "video" : "image", mainImage, thumb, poster };
}

/* ─────────────────────────────────────────────
   🎨 Main ProductGallery Component
────────────────────────────────────────────── */
export default function ProductGallery({ media = [], productName = "" }) {
  const items = useMemo(() => {
    const normalized = Array.isArray(media) ? media.map(normalizeItem) : [];
    console.log("[Gallery] 🎨 Normalized media items:", normalized.length);
    return normalized;
  }, [media]);

  const [active, setActive] = useState(0);

  // Keep active index valid if media list changes
  useEffect(() => {
    if (active >= items.length) {
      console.warn("[Gallery] ⚠️ Active index out of range, resetting.");
      setActive(0);
    }
  }, [items.length, active]);

  const activeItem = items[active];
  if (!activeItem) {
    console.warn("[Gallery] ⚠️ No active media item to render.");
    return (
      <div className="relative aspect-square rounded-xl bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-gray-400 text-sm">
        No media available
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* ──────────────── Main Image / Video ──────────────── */}
      <div className="relative aspect-square rounded-xl overflow-hidden bg-black/5">
        <AnimatePresence mode="wait">
          <motion.div
            key={activeItem.key}
            initial={{ opacity: 0.0, scale: 0.99 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0.0, scale: 0.99 }}
            transition={{ duration: 0.2 }}
            className="absolute inset-0"
          >
            {activeItem.type === "video" ? (
              <video
                src={activeItem.url}
                className="h-full w-full object-cover"
                controls
                playsInline
                preload="metadata"
                poster={activeItem.poster || undefined}
                onError={() =>
                  console.error("[Gallery] ❌ Failed to load video:", activeItem.url)
                }
              />
            ) : (
              <Image
                src={activeItem.mainImage || activeItem.url}
                alt={`${productName || "Product"} image`}
                fill
                sizes="(min-width: 1024px) 600px, (min-width: 768px) 50vw, 100vw"
                className="object-cover"
                priority
                onError={() =>
                  console.error("[Gallery] ❌ Failed to load image:", activeItem.url)
                }
              />
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* ──────────────── Thumbnails ──────────────── */}
      {items.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {items.map((t, i) => (
            <button
              key={t.key}
              type="button"
              onClick={() => setActive(i)}
              className={`relative aspect-square rounded-lg overflow-hidden ring-1 ring-black/5 transition
                ${i === active ? "ring-2 ring-indigo-500 scale-[1.02]" : "hover:ring-2 hover:ring-indigo-300"}`}
              aria-label={`Show ${t.type}`}
              aria-current={i === active ? "true" : undefined}
            >
              {t.type === "video" ? (
                <video
                  src={t.url}
                  className="h-full w-full object-cover"
                  preload="metadata"
                  muted
                />
              ) : (
                <Image
                  src={t.thumb || t.url}
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

