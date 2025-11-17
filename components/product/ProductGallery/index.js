"use client";

import React, { useState, useMemo, useEffect, useRef } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import dynamic from "next/dynamic";
import "plyr-react/plyr.css";

const Plyr = dynamic(() => import("plyr-react"), { ssr: false });

/*───────────────────────────── CLOUDINARY HELPERS ─────────────────────────────*/
function withCldParams(rawUrl, params = [], isVideo = false) {
  if (!rawUrl) return rawUrl;
  try {
    const u = new URL(rawUrl);
    if (!/res\.cloudinary\.com|cloudinary\.com/.test(u.hostname)) return rawUrl;
    const parts = u.pathname.split("/upload/");
    if (parts.length !== 2) return rawUrl;

    const baseTransforms = isVideo
      ? ["f_auto", "vc_auto", "q_auto:best"]
      : ["f_auto", "q_auto:good", "c_fill,g_auto"];
    const transformString = [...baseTransforms, ...params].join(",");

    const finalUrl = `${u.origin}${parts[0]}/upload/${transformString}/${parts[1]}${u.search}`;
    console.log("%c[Cloudinary] ✅ URL Generated:", "color:#00bcd4;font-weight:bold;", finalUrl);
    return finalUrl;
  } catch (err) {
    console.error("%c[Cloudinary] ❌ Failed parsing URL:", "color:red;font-weight:bold;", err);
    return rawUrl;
  }
}

/* ✅ FIXED POSTER BUILDER (Cloudinary-safe) */
function buildSafePoster(url) {
  if (!url) return "/placeholder.png";
  try {
    const safeUrl = url.replace(/\.mov$/i, ".mp4");
    const parts = safeUrl.split("/upload/");
    if (parts.length !== 2) return "/placeholder.png";

    // 🔥 Force poster to come from the "image" endpoint
    const base = parts[0].replace("/video/", "/image/");
    const finalPoster = `${base}/upload/f_auto,q_auto:eco,c_fill,g_auto,w_400,h_300/${parts[1]}`
      .replace(/\.[^/.]+$/, ".jpg");

    console.log("%c[Poster] ✅ Fixed poster:", "color:#f48fb1;font-weight:bold;", finalPoster);
    return finalPoster;
  } catch (err) {
    console.error("%c[Poster] ❌ Failed:", "color:red;font-weight:bold;", err);
    return "/placeholder.png";
  }
}


/*───────────────────────────── NORMALIZER ─────────────────────────────*/
function normalizeItem(m) {
  const url = m?.url || m?.secure_url || m?.src || "";
  if (!url) return null;
  const safeUrl = url.replace(/\.mov$/i, ".mp4");
  const isVideo = /\.(mp4|webm|mkv)$/i.test(safeUrl);
  const key = `${m?.public_id || safeUrl}-${m?.kind || m?.type || "media"}`;
  const mainUrl = isVideo ? withCldParams(safeUrl, [], true) : withCldParams(safeUrl, []);
  const poster = isVideo ? buildSafePoster(safeUrl) : withCldParams(safeUrl, ["f_auto", "q_auto:low"]);

  console.log("%c[normalizeItem] Media normalized:", "color:#ffb300;font-weight:bold;", {
    key,
    type: isVideo ? "video" : "image",
    mainUrl,
    poster,
  });
  return { key, url: safeUrl, type: isVideo ? "video" : "image", mainUrl, poster };
}

/*───────────────────────────── LAZY VIDEO ─────────────────────────────*/
function LazyVideo({ src, poster, autoPlay = false, onEnded }) {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);

  const safeSrc = src?.replace(/\.mov$/i, ".mp4");
  const hdUrl = safeSrc?.includes("/upload/")
    ? safeSrc.replace("/upload/", "/upload/f_auto,vc_auto,q_auto:best/")
    : safeSrc;

  const previewPoster = poster || buildSafePoster(safeSrc);

  console.groupCollapsed("%c[LazyVideo] Setup", "color:#7e57c2;font-weight:bold;");
  console.log("🎥 src:", src);
  console.log("💎 hdUrl:", hdUrl);
  console.log("🖼 poster:", previewPoster);
  console.groupEnd();

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) {
          console.log("%c[LazyVideo] 👀 Visible → load video", "color:#4caf50;");
          setVisible(true);
          obs.disconnect();
        }
      },
      { rootMargin: "300px" }
    );
    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  return (
    <div
      ref={containerRef}
      data-gallery-video="active"
      className="relative w-full h-full bg-black flex items-center justify-center overflow-hidden rounded-2xl border border-pink-400/30"
    >
      {!visible && (
        <motion.img
          src={previewPoster}
          alt="Video preview"
          className="w-full h-full object-cover blur-sm rounded-2xl"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          loading="lazy"
        />
      )}
      {visible && (
        <motion.video
          key={hdUrl}
          src={hdUrl}
          poster={previewPoster}
          autoPlay={autoPlay}
          muted={autoPlay}
          playsInline
          controls
          preload="metadata"
          className="absolute inset-0 w-full h-full object-cover rounded-2xl border border-green-400/20"
          onPlay={() => console.log("%c▶️ Playing", "color:#00e676;")}
          onPause={() => console.log("%c⏸ Paused", "color:#ffb300;")}
          onEnded={() => {
            console.log("%c🔚 Ended", "color:#2196f3;");
            if (onEnded) onEnded(); // ✅ trigger parent callback
          }}
          onLoadedData={() => {
            setLoaded(true);
            console.log("%c[LazyVideo] ✅ Loaded video", "color:#00e676;");
          }}
          onError={(e) => console.error("[LazyVideo] ❌ Error loading:", e)}
        />
      )}
      {!loaded && visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center text-pink-300 text-sm"
        >
          Loading video...
        </motion.div>
      )}
    </div>
  );
}

/*───────────────────────────── PRODUCT GALLERY ─────────────────────────────*/
export default function ProductGalleryDebug({ media = [], productName = "" }) {
  const items = useMemo(
    () => (Array.isArray(media) ? media.map(normalizeItem).filter(Boolean) : []),
    [media]
  );

  // Component States
  const [active, setActive] = useState(0);
  const [isHovered, setIsHovered] = useState(false);
  const [videoEnded, setVideoEnded] = useState(false);
  const [shouldResume, setShouldResume] = useState(false);
  const intervalRef = useRef(null);
  const activeItem = items[active] || null;

  // 🧹 Always clean old interval safely
  const clearRotation = () => {
    clearInterval(intervalRef.current);
    intervalRef.current = null;
  };

  const startRotation = () => {
    clearRotation();
    intervalRef.current = setInterval(() => {
      console.log("%c[Gallery] ⏩ Auto-next", "color:#29b6f6;font-weight:bold;");
      setActive((prev) => (prev + 1) % items.length);
    }, 5000);
  };

  // 🔁 Main Logic
  useEffect(() => {
    if (!activeItem) return;

    console.groupCollapsed(
      "%c[Gallery ⏱ Auto-advance effect]",
      "color:#ffca28;font-weight:bold;"
    );
    console.log("🎞 Active item:", activeItem.key);
    console.log("📦 Type:", activeItem.type);
    console.log("🖱 Hovered:", isHovered);
    console.groupEnd();

    clearRotation();

    // IMAGE ROTATION
    if (activeItem.type === "image") {
      // Reset video flags
      setVideoEnded(false);
      setShouldResume(false);

      if (!isHovered && items.length > 1) {
        console.log(
          "%c[Gallery] 🖼 Image → auto-switch every 5s",
          "color:#29b6f6;font-weight:bold;"
        );
        startRotation();
      } else {
        console.log(
          "%c[Gallery] 🧭 Hover on image → paused",
          "color:#ff9800;font-weight:bold;"
        );
      }
    }

    // VIDEO HANDLING
    if (activeItem.type === "video") {
      clearRotation();

      setVideoEnded(false);

      // Get actual active video
      const videoEl = document.querySelector(
        "[data-gallery-video='active'] video"
      );

      if (!videoEl) {
        console.warn(
          "%c[Gallery] ⚠️ No <video> found → retrying...",
          "color:#ff9800;font-weight:bold;"
        );

        window.__galleryRetryTimer = setTimeout(() => {
          const retryVideo = document.querySelector(
            "[data-gallery-video='active'] video"
          );
          if (retryVideo) retryVideo.play();
        }, 300);

        return;
      }

      const handleEnded = () => {
        console.log(
          "%c[Gallery] 🔚 Video finished",
          "color:#00e676;font-weight:bold;"
        );
        setVideoEnded(true);

        // Move to next media
        setActive((prev) => (prev + 1) % items.length);

        // ⭐ If user is NOT hovering, resume rotating
        if (!isHovered) {
          console.log(
            "%c[Gallery] ⭐ Resuming rotation after video end",
            "color:#4fc3f7;font-weight:bold;"
          );
          startRotation();
        }
      };

      videoEl.addEventListener("ended", handleEnded);

      return () => {
        videoEl.removeEventListener("ended", handleEnded);
        clearRotation();
      };
    }

    return () => {
      clearRotation();
      if (window.__galleryRetryTimer) {
        clearTimeout(window.__galleryRetryTimer);
        window.__galleryRetryTimer = null;
      }
    };
  }, [activeItem, isHovered, items.length]);

  // 🧭 Hover Recovery
  useEffect(() => {
    if (isHovered) {
      console.log(
        "%c[Hover Recovery] 🧭 Still hovered → stay paused",
        "color:#ff9800;font-weight:bold;"
      );
      clearRotation();
      return;
    }

    if (activeItem?.type === "video") {
      if (!videoEnded) {
        console.log(
          "%c[Hover Recovery] ⏸ Video still playing → no resume",
          "color:#ff9800;font-weight:bold;"
        );
        return;
      }

      console.log(
        "%c[Hover Recovery] ⭐ Video ended → resume rotation NOW",
        "color:#4fc3f7;font-weight:bold;"
      );
      startRotation();
      return;
    }

    // IMAGE CASE → resume after unhover
    console.log(
      "%c[Hover Recovery] 🕒 Unhover → resume rotation",
      "color:#4fc3f7;font-weight:bold;"
    );
    startRotation();
  }, [isHovered, videoEnded, activeItem?.type]);

  console.log(
    "%c[Gallery] Active Item:",
    "color:#ab47bc;font-weight:bold;",
    activeItem
  );


  // 🧱 UI
  return (
    <div className="relative flex flex-col items-center space-y-6 w-full max-w-6xl mx-auto border-2 border-dashed border-fuchsia-400/30 p-4 rounded-xl">
      {/* 🌟 Main Viewer with 3D Tilt */}
      <div
        className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden bg-zinc-900/40 perspective-1000"
        onMouseEnter={(e) => {
          console.log("%c[Hover Debug] Mouse entered viewer", "color:#ffca28;font-weight:bold;");
          clearInterval(intervalRef.current);
          if (window.__galleryRetryTimer) {
            clearTimeout(window.__galleryRetryTimer);
            window.__galleryRetryTimer = null;
          }
          setIsHovered(true);
        }}
        onMouseLeave={(e) => {
          console.log("%c[Hover Debug] Mouse left viewer", "color:#ffca28;font-weight:bold;");
          setIsHovered(false);
          const target = e.currentTarget.querySelector(".tilt-inner");
          if (target) target.style.transform = "rotateX(0deg) rotateY(0deg)";
        }}
        onMouseMove={(e) => {
          const target = e.currentTarget.querySelector(".tilt-inner");
          if (!target) return;
          const rect = e.currentTarget.getBoundingClientRect();
          const x = e.clientX - rect.left;
          const y = e.clientY - rect.top;
          const rotateX = ((y - rect.height / 2) / rect.height) * -10;
          const rotateY = ((x - rect.width / 2) / rect.width) * 10;
          target.style.transform = `rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale(1.03)`;
        }}
      >
        <div className="tilt-inner absolute inset-0 transition-transform duration-200 ease-out will-change-transform rounded-2xl shadow-[0_0_30px_rgba(255,255,255,0.1)]">
          <AnimatePresence mode="wait">
            <motion.div
              key={activeItem.key}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.6, ease: "easeInOut" }}
              className="absolute inset-0 pointer-events-none"
            >
              {activeItem.type === "video" ? (
                <LazyVideo
                  src={activeItem.mainUrl || activeItem.url}
                  poster={activeItem.poster}
                  autoPlay={true}
                />
              ) : (
                <Image
                  src={activeItem.mainUrl}
                  alt={`${productName || "Product"} image`}
                  unoptimized
                  fill
                  className="object-cover object-center absolute inset-0 rounded-2xl border border-cyan-400/30 bg-black"
                  onLoad={(e) => {
                    console.log(
                      "%c[Image] ✅ Loaded & Filling Viewer:",
                      "color:#26c6da;font-weight:bold;",
                      `${e.target.naturalWidth}x${e.target.naturalHeight}`
                    );
                  }}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <button
            onClick={() => setActive((prev) => (prev - 1 + items.length) % items.length)}
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
      </div>

      {/* 🎞 Thumbnails */}
      {items.length > 1 && (
        <div className="flex justify-center flex-wrap gap-4 md:gap-6 mt-4">
          {items.map((t, i) => (
            <motion.button
              key={t.key}
              whileHover={{ scale: 1.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => {
                console.log("%c[Gallery] 🎯 Thumbnail clicked:", "color:#ec407a;", t);
                setActive(i);
              }}
              type="button"
              className={`relative overflow-hidden rounded-xl p-1.5 transition-all duration-300 ease-out ${i === active
                ? "ring-2 ring-fuchsia-400 shadow-[0_0_25px_rgba(240,100,255,0.45)] bg-gradient-to-br from-indigo-700/60 to-fuchsia-700/50 scale-105"
                : "hover:ring-1 hover:ring-indigo-300/70 hover:shadow-[0_0_20px_rgba(160,120,255,0.3)] bg-gradient-to-br from-zinc-800/70 to-zinc-900/60 hover:scale-[1.05]"
                } w-20 h-16 md:w-24 md:h-20 flex items-center justify-center backdrop-blur-sm border border-fuchsia-400/30`}
            >
              {t.type === "video" ? (
                <video
                  src={t.mainUrl || t.url}
                  muted
                  preload="metadata"
                  poster={t.poster}
                  className="object-cover w-full h-full rounded-lg border border-green-400/30"
                />
              ) : (
                <Image
                  src={t.poster || "/placeholder.png"}
                  alt={`${t.type} thumbnail`}
                  width={96}
                  height={72}
                  unoptimized
                  className="object-cover w-full h-full rounded-lg border border-blue-400/30"
                />
              )}
            </motion.button>
          ))}
        </div>
      )}
    </div>
  );
}









