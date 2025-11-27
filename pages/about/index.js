"use client";

import Layout from "@/components/layout/Layout";
import { motion } from "framer-motion";
import Image from "next/image";

export default function AboutPage() {
  return (
    <Layout
      title="About – Shell Stories Studio"
      description="Hand-crafted seashell art made with intention. Meet the artisan, discover the process, and explore the world behind each piece."
    >
      <section className="bg-[#0f0f0f] text-white pt-32 pb-28 px-6 md:px-14">

        {/* ================= HERO SECTION (Parallax + Gradient Overlay) ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="relative max-w-5xl mx-auto text-center mb-24"
        >
          <h1 className="font-playfair text-5xl md:text-6xl mb-6 tracking-tight">
            The Story Behind the Shells
          </h1>

          <div className="h-px w-32 mx-auto bg-gradient-to-r from-transparent via-[#d9b86c] to-transparent mb-8"></div>

          <p className="text-white/70 text-lg leading-relaxed max-w-2xl mx-auto">
            For those who seek beauty in the quiet —
            every shell becomes a calm moment, transformed into an intimate keepsake
            you can hold, cherish, and remember.
          </p>
        </motion.div>

        {/* ================= LUXURY HERO IMAGE ================= */}
        <div className="relative w-full h-[420px] md:h-[540px] rounded-3xl overflow-hidden shadow-2xl mb-32 border border-white/10">
          <Image
            src="https://res.cloudinary.com/dr5v7f0wd/image/upload/v1763996536/wz8209ej1a0nje1jtflb.jpg"
            alt="Shell sample from Shell Stories Studio"
            fill
            className="object-cover scale-105 opacity-[0.95]"
          />

          {/* Soft luxury gradient */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        </div>

        {/* ================= FOUNDER SECTION (Upgraded) ================= */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 mb-32"
        >
          <div className="flex flex-col justify-center">

            <h2 className="font-playfair text-4xl mb-4 tracking-tight">Hi, I’m Ghazal</h2>

            <p className="text-white/70 leading-relaxed text-[17px]">
              In 20XX, I found myself holding a seashell on a quiet beach —
              and I realised this simple natural form could become something more.
              A moment of stillness. A piece of art. A story.
            </p>

            <p className="text-white/70 leading-relaxed text-[17px] mt-4">
              From that moment, I founded Shell Stories Studio with a single intention:
              to turn the gentle curves of nature into handcrafted keepsakes
              that feel calming, meaningful, and deeply personal.
            </p>

            {/* Signature touch */}
            <p className="font-playfair text-xl text-[#d9b86c] mt-6">
              — Ghazal
            </p>
          </div>

          <div className="relative h-[380px] rounded-3xl overflow-hidden border border-[#d9b86c]/20 shadow-xl">
            <Image
              src="https://res.cloudinary.com/dr5v7f0wd/image/upload/v1763997876/ailo6ghswzyojjhehaa9.jpg"
              alt="Studio workspace – painting shells by hand"
              fill
              className="object-cover"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
          </div>
        </motion.div>

        {/* ================= DECORATIVE PHRASE ================= */}
        <div className="text-center mb-24">
          <p className="font-playfair text-2xl text-white/80 italic tracking-wide">
            “Nature gives the shape.
            We give it meaning.”
          </p>
        </div>

        {/* ================= PROCESS GRID (Luxury Cards) ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-6xl mx-auto mb-40"
        >
          <h2 className="font-playfair text-4xl text-center mb-16 tracking-tight">
            Our Craft
          </h2>

          <div className="grid md:grid-cols-2 gap-12">
            {[
              {
                step: "Cleaning the Shells",
                text: "Each shell is hand-washed, sanitised and dried to reveal its natural beauty.",
                img: "https://res.cloudinary.com/dr5v7f0wd/image/upload/v1764002330/jm6lmmeoujj7ptxqfc25.jpg"
              },
              {
                step: "Adding the Gold Edge",
                text: "Delicate gold leaf is applied by hand — our signature luxury finish.",
                img: "https://res.cloudinary.com/dr5v7f0wd/image/upload/v1764002110/zbshl8pfw1w0ovsk67km.jpg"
              },
              {
                step: "Hand Painting",
                text: "Detailed brushwork brings each shell to life with colour and emotion.",
                img: "https://res.cloudinary.com/dr5v7f0wd/image/upload/v1764002330/jm6lmmeoujj7ptxqfc25.jpg"
              },
              {
                step: "Artwork Transfer",
                text: "Your selected illustration is precisely bonded to the shell surface.",
                img: "https://res.cloudinary.com/dr5v7f0wd/image/upload/v1764002110/zbshl8pfw1w0ovsk67km.jpg"
              },
              {
                step: "Detail Finishing",
                text: "Final touches refine each piece — ensuring symmetry and balance.",
                img: "https://res.cloudinary.com/dr5v7f0wd/image/upload/v1764002330/jm6lmmeoujj7ptxqfc25.jpg"
              },
              {
                step: "Final Sealing",
                text: "A professional seal is applied for lasting clarity, shine and preservation.",
                img: "https://res.cloudinary.com/dr5v7f0wd/image/upload/v1764002110/zbshl8pfw1w0ovsk67km.jpg"
              }
            ].map((item, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.15 }}
                className="rounded-3xl overflow-hidden shadow-xl border border-[#d9b86c]/20 bg-white/5 backdrop-blur-sm"
              >
                <div className="relative h-56 w-full">
                  <Image
                    src={item.img}
                    alt={item.step}
                    fill
                    className="object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
                </div>
                <div className="p-6 text-center">
                  <h3 className="font-playfair text-xl mb-3 text-[#d9b86c] tracking-wide">
                    {item.step}
                  </h3>
                  <p className="text-white/70 text-sm leading-relaxed">
                    {item.text}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>


        {/* ================= FEATURED ART + VALUE ================= */}
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-20 mb-40">
          <div className="relative h-[380px] rounded-3xl overflow-hidden shadow-2xl border border-white/10">
            <Image
              src="https://res.cloudinary.com/dr5v7f0wd/image/upload/v1763996836/na1kycimhiivihppzrw4.jpg"
              alt="Artistic process in progress"
              fill
              className="object-cover scale-[1.03]"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent" />
          </div>

          <div className="flex flex-col justify-center">
            <h2 className="font-playfair text-4xl mb-6 tracking-tight">Crafted With Intention</h2>
            <p className="text-white/70 leading-relaxed text-[17px]">
              Every shell passes through hours of careful handwork —
              slow painting, delicate finishing, and quiet craftsmanship.
              These pieces carry stillness, warmth, and story into your home.
            </p>
          </div>
        </div>

        {/* ================= SOCIAL PROOF ================= */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="max-w-5xl mx-auto mb-40 text-center"
        >
          <h2 className="font-playfair text-4xl mb-8">Moments Made to Be Cherished</h2>
          <p className="text-white/70 max-w-xl mx-auto leading-relaxed mb-6">
            Join collectors who’ve welcomed Shell Stories pieces into their homes —
            each one shaped by nature and perfected by hand.
          </p>

          <motion.a
            href="/testimonials"
            whileHover={{ scale: 1.03 }}
            className="inline-block px-10 py-3 border border-white/30 rounded-full text-white/80 hover:text-white hover:border-white transition"
          >
            Read Their Stories
          </motion.a>
        </motion.div>

        {/* ================= CTA ================= */}
        <div className="text-center">
          <motion.a
            href="/products"
            whileHover={{ scale: 1.06 }}
            className="px-12 py-4 bg-white text-black rounded-full font-semibold shadow-xl hover:bg-white/90 transition"
          >
            Explore the Collection
          </motion.a>
        </div>

      </section>
    </Layout>
  );
}

