"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";
import dynamic from "next/dynamic";
import "plyr-react/plyr.css";

const Plyr = dynamic(() => import("plyr-react"), {
  ssr: false, // ✅ Disable server-side rendering for Plyr
});


/**
 * LazyVideo — Plyr Upgrade Edition
 * ✅ Keeps your logic & lazy loading
 * ✅ Uses Plyr for adaptive video playback
 * ✅ Cloudinary HLS / MP4 support
 */
export default function LazyVideo({ src, poster, autoPlay = false }) {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const containerRef = useRef(null);

  const safeSrc = src?.replace(/\.mov$/i, ".mp4");
  const hdUrl = safeSrc?.includes("/upload/")
    ? safeSrc.replace(
      "/upload/",
      "/upload/f_auto,vc_auto,q_auto:best,br_3m,w_1920,h_1080/"
    )
    : safeSrc;

  // ✅ Try HLS (.m3u8) stream for faster adaptive playback
  const hlsSrc = hdUrl?.replace(".mp4", ".m3u8");

  const previewPoster =
    poster ||
    (safeSrc?.includes("/upload/")
      ? safeSrc
        .replace(
          "/upload/",
          "/upload/so_1,f_jpg,q_auto:eco,c_fill,g_auto,w_400,h_400/"
        )
        .replace(/\.[^/.]+$/, ".jpg")
      : "/placeholder.png");

  console.groupCollapsed("[LazyVideo] Setup");
  console.log("🎥 SafeSrc:", safeSrc);
  console.log("💎 HD URL:", hdUrl);
  console.log("📡 HLS URL:", hlsSrc);
  console.log("🖼 Poster:", previewPoster);
  console.groupEnd();

  /* ──────────────── Lazy load trigger ──────────────── */
  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: "300px" }
    );

    if (containerRef.current) obs.observe(containerRef.current);
    return () => obs.disconnect();
  }, []);

  const handleReady = () => {
    console.info("[LazyVideo] ✅ Plyr ready");
    setLoaded(true);
  };

  return (
    <div
      ref={containerRef}
      className="relative w-full h-full overflow-hidden rounded-xl bg-black/10"
    >
      {/* Poster before visible */}
      {!visible && (
        <motion.img
          src={previewPoster}
          alt="Video preview"
          className="w-full h-full object-cover blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          loading="lazy"
        />
      )}

      {/* When visible, show Plyr */}
      {visible && (
        <motion.div
          key={hlsSrc}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="w-full h-full relative z-10" // ✅ Ensure controls are on top
          style={{ pointerEvents: "auto" }}       // ✅ Allow clicks to pass
        >
          <Plyr
            source={{
              type: "video",
              sources: [{ src: hdUrl, type: "video/mp4" }],
              poster: previewPoster,
            }}
            options={{
              controls: [
                "play-large",
                "fullscreen",
              ],
              preload: "metadata",
              autoplay: autoPlay,
              clickToPlay: true,
              playsinline: true,
              muted: autoPlay,
            }}
            onReady={handleReady}
          />
        </motion.div>
      )}

      {/* Optional subtle fade-in overlay */}
      {!loaded && visible && (
        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: 0 }}
          transition={{ duration: 1.2 }}
          className="absolute inset-0 bg-black/20"
        />
      )}
    </div>
  );
}
