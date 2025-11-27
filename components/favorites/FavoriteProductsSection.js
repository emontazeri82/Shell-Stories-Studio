"use client";

import { motion } from "framer-motion";
import Image from "next/image";
import Link from "next/link";

export default function FavoriteProductsSection({ products }) {
  return (
    <section className="w-full bg-gradient-to-b from-[#00000000] to-[#1a1a1a] py-20 px-6 md:px-12">
      
      {/* TITLE */}
      <h2 className="text-3xl md:text-4xl font-playfair text-white text-center mb-12">
        Favourite Pieces
      </h2>

      {/* HORIZONTAL SCROLLER */}
      <div className="overflow-x-scroll scrollbar-none -mx-6 px-6 pb-2">
        <motion.div
          className="flex gap-8 md:gap-12"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.4 }}
          variants={{
            hidden: { opacity: 0, x: 50 },
            visible: {
              opacity: 1,
              x: 0,
              transition: { staggerChildren: 0.15 },
            },
          }}
        >
          {products.map((prod) => (
            <motion.div
              key={prod.id}
              className="min-w-[260px] md:min-w-[320px] flex-shrink-0"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              <Link href={`/products#favorite-${prod.id}`} scroll>
                <div className="bg-[#272727] rounded-lg overflow-hidden shadow-lg">
                  
                  {/* PRODUCT IMAGE */}
                  <div className="relative w-full h-60">
                    <Image
                      src={prod.image_url || "/fallback.jpg"}
                      alt={prod.name || "Shell Product"}
                      fill
                      sizes="300px"
                      className="object-cover"
                    />
                  </div>

                  <div className="p-4">
                    <h3 className="text-lg md:text-xl text-white font-medium">
                      {prod.name}
                    </h3>
                  </div>
                </div>
              </Link>
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* VIEW ALL */}
      <div className="mt-10 text-center">
        <Link
          href="/products"
          className="inline-block text-white/80 hover:text-white transition-colors duration-300"
        >
          View All Collections →
        </Link>
      </div>
    </section>
  );
}
