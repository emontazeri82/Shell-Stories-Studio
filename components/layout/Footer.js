"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { useState } from "react";

export default function Footer() {

  return (
    <footer className="relative w-full bg-[#0f0f0f] text-white py-20 px-6 md:px-14 mt-10">

      {/* LUXURY SUBTLE TEXTURE */}
      <div className="absolute inset-0 opacity-[0.08] pointer-events-none"
        style={{ backgroundImage: "url('/textures/noise.png')" }} />

      <div className="relative z-10 max-w-5xl mx-auto">

        {/* TITLE */}
        <motion.h2
          className="text-center font-playfair text-4xl md:text-5xl tracking-wide"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 1 }}
        >
          Shell Stories Studio
        </motion.h2>

        {/* DIVIDER */}
        <div className="w-full max-w-lg mx-auto mt-6 h-[1px] bg-white/15" />
        <motion.div
          className="mt-12 text-center max-w-xl mx-auto"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 1 }}
        >
          <p className="text-white/70 text-lg leading-relaxed font-light">
            Modern handcrafted shell art inspired by the stories of the sea.
          </p>

          <p className="text-white/50 text-sm mt-4 italic">
            Designed with intention. Crafted in Austin, Texas.
          </p>
        </motion.div>

        {/* SOCIAL ICONS */}
        <motion.div
          className="flex justify-center gap-8 mt-16"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3, duration: 1 }}
        >
          <Link href="https://instagram.com" target="_blank">
            <FaInstagram className="text-2xl hover:text-white/80 transition-colors duration-300" />
          </Link>

          <Link href="https://tiktok.com" target="_blank">
            <FaTiktok className="text-2xl hover:text-white/80 transition-colors duration-300" />
          </Link>
        </motion.div>

        {/* FOOTER TEXT */}
        <motion.p
          className="text-center text-white/40 text-sm mt-10"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.4, duration: 1 }}
        >
          Crafted by hand in Austin, Texas
        </motion.p>

        <motion.div
          className="text-center text-white/25 text-xs mt-4"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          transition={{ delay: 0.5, duration: 1 }}
        >
          © {new Date().getFullYear()} Shell Stories Studio. All rights reserved.
        </motion.div>
      </div>
    </footer>
  );
}

