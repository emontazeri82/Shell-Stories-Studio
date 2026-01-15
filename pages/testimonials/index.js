"use client";

import Layout from "@/components/layout/Layout";
import { testimonials } from "@/components/testimonials/testimonialsData";
import TestimonialCard from "@/components/testimonials/TestimonialCard";

export default function TestimonialsPage() {
  return (
    <Layout title="Testimonials — Shell Stories Studio">
      <section
        className="
          relative min-h-screen py-32 px-6 overflow-hidden
          bg-[radial-gradient(1200px_600px_at_20%_-10%,rgba(99,102,241,0.08),transparent),
              radial-gradient(800px_400px_at_80%_30%,rgba(251,191,36,0.10),transparent)]
          bg-white dark:bg-zinc-950
        "
      >
        {/* Soft noise texture */}
        <div className="pointer-events-none absolute inset-0 opacity-[0.035] bg-[url('/textures/noise.png')]" />

        {/* Ambient floating lights */}
        <div className="absolute -top-40 -left-32 w-[520px] h-[520px] bg-indigo-400/10 blur-[140px] rounded-full will-change-transform animate-[float_18s_ease-in-out_infinite]" />
        <div className="absolute top-[30%] -right-40 w-[420px] h-[420px] bg-amber-300/12 blur-[130px] rounded-full will-change-transform animate-[float_22s_ease-in-out_infinite]" />

        <div className="relative max-w-6xl mx-auto">
          {/* Header */}
          <div className="text-center mb-24">
            <h1 className="font-playfair text-5xl md:text-6xl mb-6 tracking-tight">
              Stories from Our Collectors
            </h1>
            <p className="text-zinc-600 dark:text-zinc-400 max-w-xl mx-auto text-lg leading-relaxed">
              Each piece carries a story — here are a few shared by those who
              welcomed Shell Stories into their homes.
            </p>
          </div>

          {/* Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-10 gap-y-20">
            {testimonials.map((t, i) => (
              <div
                key={t.id}
                className={i % 2 === 1 ? "md:translate-y-12" : ""}
              >
                <TestimonialCard testimonial={t} index={i} />
              </div>
            ))}
          </div>
        </div>
      </section>
    </Layout>
  );
}
