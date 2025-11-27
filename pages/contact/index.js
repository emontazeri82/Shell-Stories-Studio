"use client";

import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import { useState } from "react";
import { FiMail, FiPhone, FiMapPin } from "react-icons/fi";
import axios from "axios";

export default function ContactPage() {
  const [form, setForm] = useState({ name: "", email: "", message: "" });
  const [status, setStatus] = useState(null);

  const handleChange = (e) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus("loading");

    try {
      const res = await axios.post("/api/contact", form);
      if (res.status !== 200) throw new Error("Send failed");
      setStatus("success");
      setForm({ name: "", email: "", message: "" });
    } catch (err) {
      setStatus("error");
    }
  };

  return (
    <Layout title="Contact - Shell Stories Studio">
      <section className="min-h-screen bg-[#0f0f0f] text-white py-28 px-6 md:px-12 relative overflow-hidden">

        {/* Soft Background Glow */}
        <div className="absolute top-0 left-0 w-[450px] h-[450px] bg-indigo-500/10 blur-[160px] rounded-full"></div>
        <div className="absolute bottom-0 right-0 w-[450px] h-[450px] bg-fuchsia-500/10 blur-[160px] rounded-full"></div>

        <div className="relative z-10 max-w-5xl mx-auto">

          {/* PAGE TITLE */}
          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-4xl md:text-5xl font-playfair mb-6 text-center"
          >
            Let's Connect
          </motion.h1>

          <p className="text-white/70 text-lg mb-16 text-center max-w-2xl mx-auto leading-relaxed">
            Questions about an order, custom artwork, or collaboration?
            Send a message — I respond personally within 24 hours.
          </p>

          {/* CONTACT INFO */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid md:grid-cols-3 gap-10 mb-16 text-white/80 text-center"
          >
            <div>
              <FiPhone className="text-3xl mx-auto mb-3" />
              <p className="font-semibold">Phone</p>
              <p className="text-white/60 text-sm">+1 (210) 286-1723</p>
            </div>

            <div>
              <FiMail className="text-3xl mx-auto mb-3" />
              <p className="font-semibold">Email</p>
              <p className="text-white/60 text-sm">ghazal.montazeri@gmail.com</p>
            </div>

            <div>
              <FiMapPin className="text-3xl mx-auto mb-3" />
              <p className="font-semibold">Location</p>
              <p className="text-white/60 text-sm">Austin, Texas</p>
            </div>
          </motion.div>

          {/* CONTACT FORM */}
          <motion.form
            onSubmit={handleSubmit}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="bg-white/5 backdrop-blur-xl border border-white/10 p-10 rounded-3xl shadow-2xl space-y-6"
          >
            <input
              type="text"
              name="name"
              placeholder="Your Name"
              required
              value={form.name}
              onChange={handleChange}
              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            />

            <input
              type="email"
              name="email"
              placeholder="Your Email"
              required
              value={form.email}
              onChange={handleChange}
              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            />

            <textarea
              name="message"
              placeholder="Your Message"
              required
              rows="5"
              value={form.message}
              onChange={handleChange}
              className="w-full p-4 rounded-lg bg-white/10 border border-white/20 text-white placeholder-white/40 focus:outline-none focus:ring-2 focus:ring-white/40"
            />

            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              type="submit"
              className="w-full py-4 rounded-xl bg-white text-black font-semibold text-lg shadow-xl hover:bg-white/90 transition"
            >
              {status === "loading"
                ? "Sending…"
                : status === "success"
                  ? "Sent ✓"
                  : "Send Message"}
            </motion.button>

            {status === "error" && (
              <p className="text-red-400 text-center text-sm">
                Something went wrong. Please try again.
              </p>
            )}
          </motion.form>
        </div>
      </section>
    </Layout>
  );
}

