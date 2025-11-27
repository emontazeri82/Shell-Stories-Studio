import Layout from "../components/layout/Layout";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import axios from "axios";
import FavoriteProductsSection from "@/components/favorites/FavoriteProductsSection";
import ArtistSection from "@/components/home/ArtistSection";

export default function Home() {
  const [parallax, setParallax] = useState({ x: 0, y: 0 });
  const [favorites, setFavorites] = useState([]);

  const handleMouseMove = (e) => {
    const x = (e.clientX / window.innerWidth - 0.5) * 6;
    const y = (e.clientY / window.innerHeight - 0.5) * 6;
    setParallax({ x, y });
  };
  useEffect(() => {
    const fetchFavorites = async () => {
      try {
        const url = "/api/products/favorites?limit=12&minStock=1";
  
        console.log("[Axios] Calling:", url);
  
        const res = await axios.get(url);
  
        console.log("[Axios] Favorites Response:", res.data);
  
        setFavorites(res.data.items || []); // <-- IMPORTANT
      } catch (err) {
        console.error("[Axios] Favorites Error:", err);
      }
    };
  
    fetchFavorites();
  }, []);

  return (
    <Layout>
      {/* HERO WRAPPER */}
      <div
        className="relative w-full min-h-screen overflow-hidden"
        onMouseMove={handleMouseMove}
      >
        {/* VIDEO BACKGROUND */}
        <video
          className="absolute inset-0 w-full h-full object-cover z-0"
          src="https://res.cloudinary.com/dr5v7f0wd/video/upload/f_auto,q_auto:best,vc_h265,br_5000k,du_10/v1763656884/cvn2jzv7jrqro0ejgvny.mp4"
          autoPlay
          muted
          loop
          playsInline
        />

        {/* DARK OVERLAY */}
        <div className="absolute inset-0 z-[1] bg-gradient-to-b from-[rgba(0,0,0,0.55)] via-[rgba(0,0,0,0.40)] to-[rgba(0,0,0,0.60)]" />

        {/* HERO CONTENT */}
        <motion.div
          className="relative z-[2] flex flex-col items-center justify-center h-[75vh] px-6 text-center select-none"
          animate={{ opacity: 1 }}
          initial={{ opacity: 0 }}
          transition={{ duration: 1.4, ease: 'easeOut' }}
          style={{ transform: `translate(${parallax.x}px, ${parallax.y}px)` }}
        >
          {/* TITLE */}
          <motion.h1
            className="text-5xl md:text-7xl font-playfair font-semibold text-[#f3efe5] drop-shadow-[0_10px_35px_rgba(0,0,0,0.85)] tracking-wide leading-tight"
            initial={{ y: 40, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 1.2 }}
          >
            Shell Stories Studio
          </motion.h1>

          {/* SUBTEXT */}
          <motion.p
            className="max-w-3xl mt-6 text-lg md:text-2xl text-[#e3ded0] leading-relaxed font-light drop-shadow-[0_4px_25px_rgba(0,0,0,0.85)]"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.5, duration: 1.2 }}
          >
            Artfully hand-painted seashells—each piece telling a story of calm,
            nature, and timeless beauty.
          </motion.p>

          {/* CTA BUTTON */}
          <motion.a
            href="/products"
            className="mt-10 px-10 py-4 text-lg rounded-full font-medium bg-white/20 backdrop-blur-md text-white border border-white/20 shadow-[0_8px_30px_rgba(0,0,0,0.45)] hover:bg-white/30 transition-all duration-300"
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.8, duration: 1.1 }}
            whileHover={{ scale: 1.08 }}
            whileTap={{ scale: 0.95 }}
          >
            Explore the Collection
          </motion.a>

          {/* TYPOGRAPHY SECTION */}
          <motion.div
            className="mt-10 max-w-3xl text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.3, duration: 1 }}
          >
            <h2 className="text-3xl md:text-5xl font-playfair text-white leading-tight drop-shadow-[0_8px_25px_rgba(0,0,0,0.6)]">
              Where Art Meets the Tide
            </h2>
            <p className="mt-4 text-base md:text-lg text-white/90 font-light leading-relaxed max-w-2xl mx-auto drop-shadow-[0_4px_20px_rgba(0,0,0,0.6)]">
              Each shell is painted slowly, layer by layer, inspired by the quiet
              rhythm of the ocean. Every piece carries a story—timeless, calming,
              and crafted with intention.
            </p>
          </motion.div>
        </motion.div>

        {/* SCROLL INDICATOR BELOW TYPOGRAPHY */}
        <motion.div
          className="absolute bottom-10 left-1/2 -translate-x-1/2 flex flex-col items-center z-[3] cursor-pointer select-none"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.4, duration: 1 }}
          onClick={() => {
            const nextSection = document.getElementById("next-section");
            if (nextSection) nextSection.scrollIntoView({ behavior: "smooth" });
          }}
        >
          {/* PULSING RING */}
          <motion.div
            className="absolute w-14 h-14 rounded-full border border-white/25"
            animate={{ opacity: [0.3, 0.6, 0.3], scale: [1, 1.15, 1] }}
            transition={{ duration: 2, repeat: Infinity }}
          />

          {/* ARROW ICON */}
          <motion.div animate={{ y: [0, 12, 0] }} transition={{ repeat: Infinity, duration: 1.4, ease: 'easeInOut' }}>
            <svg
              width="42"
              height="42"
              viewBox="0 0 24 24"
              fill="none"
              stroke="#ffffff"
              strokeWidth="2.4"
              strokeLinecap="round"
              strokeLinejoin="round"
              className="drop-shadow-[0_6px_18px_rgba(255,255,255,0.7)]"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </motion.div>

          <p className="text-sm mt-3 text-white/95">Scroll</p>
        </motion.div>
      </div>

      {/* ANCHOR TARGET FOR SCROLL */}
      <div id="next-section"></div>
      <FavoriteProductsSection products={favorites} />
      <ArtistSection />
    </Layout>
  );
}










