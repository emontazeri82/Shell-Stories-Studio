"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export default function ArtistSection() {
  const [active, setActive] = useState("main");
  const [parallax, setParallax] = useState({ x: 0, y: 0 });

  // --- Image sources as REACT STATE (fixes mutation issue) ---
  const [imageSources, setImageSources] = useState({
    main: "https://res.cloudinary.com/dr5v7f0wd/image/upload/f_auto,q_auto:best,cs_srgb,fl_progressive:steep,e_sharpen,h_1500/v1763743966/pkhvimifj9lrcppfim6m.jpg",
    small1: "https://res.cloudinary.com/dr5v7f0wd/image/upload/f_auto,q_auto:best,cs_srgb,fl_progressive:steep,e_sharpen,h_1500/v1763743942/nvrkvpum8dxi1vvbmduy.jpg",
    small2: "https://res.cloudinary.com/dr5v7f0wd/image/upload/f_auto,q_auto:best,cs_srgb,fl_progressive:steep,e_sharpen,h_1500/v1763743812/qt8gyandoupiynp8nhfe.jpg",
  });

  // --- Image metadata (positions, z-index logic kept exactly as you wrote) ---
  const images = {
    main: {
      id: "main",
      src: imageSources.main,
      position: "absolute top-0 left-0 w-[70%] h-[65%]",
      z: active === "main" ? "z-30" : "z-10",
    },
    small1: {
      id: "small1",
      src: imageSources.small1,
      position: "absolute bottom-0 right-0 w-[55%] h-[55%]",
      z: active === "small1" ? "z-30" : "z-10",
    },
    small2: {
      id: "small2",
      src: imageSources.small2,
      position: "absolute bottom-8 left-[20%] w-[45%] h-[38%]",
      z: active === "small2" ? "z-30" : "z-10",
    },
  };

  // --- Swapping logic (unchanged, just made React-safe) ---
  const swapImages = (hovered) => {
    if (hovered === active) return;

    setImageSources((prev) => {
      const newOrder = {
        main: prev[hovered],
        small1: hovered === "small1" ? prev.main : prev.small1,
        small2: hovered === "small2" ? prev.main : prev.small2,
      };
      return newOrder;
    });

    setActive(hovered);
  };

  return (
    <section className="w-full bg-gradient-to-b from-[#1a1a1a] to-[#0f0f0f] py-24 px-6 md:px-16">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-16">

        {/* LEFT TEXT SIDE */}
        <motion.div
          initial={{ opacity: 0, x: -40 }}
          whileInView={{ opacity: 1, x: 0 }}
          transition={{ duration: 1 }}
          viewport={{ once: true }}
          className="flex flex-col justify-center text-white"
        >
          <h2 className="font-playfair text-4xl md:text-5xl leading-tight mb-6">
            The Artist Behind the Shells
          </h2>

          <p className="text-lg md:text-xl text-white/80 leading-relaxed mb-6">
            Each piece begins with a single shell — collected, prepared, and painted
            with patience. Inspired by the rhythm of the ocean, my work blends calm
            colors, organic textures, and the soft stories each shell carries.
          </p>

          <p className="text-base md:text-lg text-white/70 leading-relaxed">
            Every brushstroke is intentional. Every detail is crafted slowly.
            These shells are small artworks shaped by time, nature, and gentle hands.
          </p>
        </motion.div>

        {/* RIGHT SIDE — INTERACTIVE COLLAGE WITH PARALLAX + PREMIUM SHADOW */}
        <div
          className="relative w-full h-[580px]"
          onMouseMove={(e) => {
            const rect = e.currentTarget.getBoundingClientRect();
            const x = (e.clientX - rect.left) / rect.width - 0.5;
            const y = (e.clientY - rect.top) / rect.height - 0.5;

            // Save mouse parallax in state
            setParallax({ x, y });
          }}
          onMouseLeave={() => setParallax({ x: 0, y: 0 })}
        >
          {Object.values(images).map((img) => (
            <motion.div
              key={img.id}

              // ⭐ FIX: prevent distortion during swap
              layout="position"

              onHoverStart={() => setActive(img.id)}
              onTap={() => swapImages(img.id)} // mobile click

              transition={{
                duration: 0.65, // smoother
                ease: [0.22, 1, 0.36, 1], // Apple "swoosh" easing
              }}

              className={`${img.position} ${img.z} rounded-3xl overflow-hidden cursor-pointer`}

              style={{
                // ⭐ GPU acceleration for smoother movement
                willChange: "transform, filter, box-shadow",

                // ⭐ PERFECT parallax physics
                transform: `
                translate3d(
                  ${parallax.x * (active === img.id ? 14 : 5)}px,
                  ${parallax.y * (active === img.id ? 14 : 5)}px,
                  0
                )
                scale(${active === img.id ? 1.12 : 1})
                rotate3d(
                  ${parallax.y},
                  ${-parallax.x},
                  0,
                  ${active === img.id ? 6 : 2}deg
                )
              `,
                // ⭐ Hollywood shadows (smoothest possible)
                boxShadow:
                  active === img.id
                    ? "0 40px 110px rgba(0,0,0,0.55), 0 8px 25px rgba(0,0,0,0.30)"
                    : "0 18px 45px rgba(0,0,0,0.35)",

                // ⭐ High-end color punch without oversaturation
                filter:
                  active === img.id
                    ? "brightness(1.18) contrast(1.1) saturate(1.05)"
                    : "brightness(0.9)",

                // Smoother transitions
                transition:
                  "transform 0.55s cubic-bezier(0.22,1,0.36,1), filter 0.45s ease, box-shadow 0.45s ease",
              }}
            >
              <motion.div
                key={img.src} // critical for smooth fade swap
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.45 }}
                className="absolute inset-0"
              >
                <Image
                  src={img.src}
                  alt={img.id}
                  fill
                  className="object-cover"
                  sizes="(max-width: 768px) 100vw, 50vw"
                  draggable={false}
                />
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}


