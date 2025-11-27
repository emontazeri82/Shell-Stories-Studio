"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { FaInstagram, FaTiktok } from "react-icons/fa";
import { useState } from "react";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) return;

    setSubmitted(true);
    setEmail("");

    // purely visual — no backend call
    setTimeout(() => setSubmitted(false), 2500);
  };

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

        {/* NEWSLETTER */}
        <motion.div
          className="mt-12 text-center"
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.2, duration: 1 }}
        >
          <p className="text-white/70 text-lg mb-6">
            Join our studio updates — new releases, behind-the-scenes, and more.
          </p>

          <form
            onSubmit={handleSubscribe}
            className="flex flex-col sm:flex-row justify-center gap-4 sm:gap-3 mx-auto max-w-xl"
          >
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              type="email"
              placeholder="Enter your email"
              className="w-full sm:flex-1 px-5 py-3 rounded-full bg-white/10 border border-white/20
                         text-white placeholder-white/40 focus:outline-none focus:ring-2 
                         focus:ring-white/40 backdrop-blur-md"
            />

            <button
              type="submit"
              className="px-8 py-3 rounded-full bg-white/20 backdrop-blur-lg border border-white/30
                         hover:bg-white/30 transition-all duration-300"
            >
              {submitted ? "Subscribed ✓" : "Subscribe"}
            </button>
          </form>

          {submitted && (
            <motion.p
              className="mt-3 text-green-400 text-sm"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
            >
              You're subscribed — thank you! (visual only)
            </motion.p>
          )}
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

