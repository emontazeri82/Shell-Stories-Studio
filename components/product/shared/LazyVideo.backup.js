
"use client";

import { useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

/**
 * LazyVideo — Smooth, Debug-Friendly Loader
 * ✅ Converts MOV → MP4
 * ✅ Fades in and pauses at first frame
 * ✅ Logs every key lifecycle event
 */
export default function LazyVideo({ src, poster, autoPlay = false }) {
  const [visible, setVisible] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const videoRef = useRef(null);

  const safeSrc = src?.replace(/\.mov$/i, ".mp4");
  const hdUrl = safeSrc?.includes("/upload/")
    ? safeSrc.replace(
        "/upload/",
        "/upload/f_auto,vc_auto,q_auto:best,br_3m,w_1920,h_1080/"
      )
    : safeSrc;

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

  // ✅ Log URL states
  console.groupCollapsed("[LazyVideo] Setup");
  console.log("🎥 SafeSrc:", safeSrc);
  console.log("💎 HD URL:", hdUrl);
  console.log("🖼 Poster:", previewPoster);
  console.log("⚙️ AutoPlay:", autoPlay);
  console.groupEnd();

  useEffect(() => {
    const obs = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            console.info("[LazyVideo] ▶ Visible — start loading video.");
            setVisible(true);
            obs.disconnect();
          }
        });
      },
      { rootMargin: "300px" }
    );

    if (videoRef.current) obs.observe(videoRef.current);
    return () => obs.disconnect();
  }, []);

  const handleLoadedData = (e) => {
    console.info("[LazyVideo] ✅ Video loaded:", e.target.src);
    setLoaded(true);
    if (!autoPlay) {
      e.target.pause();
      console.log("[LazyVideo] ⏸ Paused at first frame.");
    }
  };

  const handleError = (e) => {
    console.error("[LazyVideo] ❌ Failed to load:", e.target.src);
  };

  return (
    <div
      ref={videoRef}
      className="relative w-full h-full overflow-hidden rounded-xl bg-black/10"
    >
      {!visible && (
        <motion.img
          src={previewPoster}
          alt="Video preview"
          className="w-full h-full object-cover blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4 }}
          loading="lazy"
          onError={() => console.error("[LazyVideo] ❌ Poster failed:", previewPoster)}
        />
      )}

      {visible && (
        <motion.video
          key={hdUrl}
          src={hdUrl}
          poster={previewPoster}
          controls
          playsInline
          preload="metadata"
          autoPlay={autoPlay}
          muted={autoPlay}
          onLoadedData={handleLoadedData}
          onError={handleError}
          className={`w-full h-full object-cover transition-all duration-700 ${
            loaded ? "opacity-100" : "opacity-0"
          }`}
        />
      )}
    </div>
  );
}
