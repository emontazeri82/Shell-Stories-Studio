// pages/products/index.js
"use client";

import { useState } from "react";
import Layout from "@/components/layout/Layout";
import ProductCard from "@/components/product/ProductCard";
import ProductFavorite from "@/components/product-card/ProductFavorite";
import { getProductsServerSideProps } from "@/lib/static-data/getServerSideProps";
import { useRouter } from "next/router";
import { useScrollToHighlightedProduct } from "@/hooks/useScrollToHighlightedProduct";

export const getServerSideProps = getProductsServerSideProps;

export default function ProductsPage({ products }) {
  const router = useRouter();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightFromCenter, setHighlightFromCenter] = useState(false);

  // Scroll to highlighted card if query indicates
  useScrollToHighlightedProduct({
    setHighlightedId,
    setHighlightFromCenter,
  });

  const hydrateAndOpen = async (product) => {
    try {
      const res = await fetch(`/api/products/${product.id}`);
      if (res.ok) {
        const data = await res.json();
        if (data?.product) {
          setSelectedProduct({ ...product, ...data.product });
          return;
        }
      }
    } catch {
      /* ignore */
    }
    setSelectedProduct(product);
  };

  const handleProductClick = (product) => {
    hydrateAndOpen(product);
    setHighlightedId(null);
    setHighlightFromCenter(false);
    router.push(`/products?id=${product.id}`, undefined, { shallow: true });
  };

  const handleCloseModal = () => {
    setSelectedProduct(null);
    router.replace("/products", undefined, { shallow: true });
  };

  return (
    <Layout>
      <div className="min-h-screen bg-stone-50 dark:bg-zinc-950 text-zonc-900 dark:text-zinc-100">

        <div className="max-w-[1600px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <h1
            className="
            text-2xl
            sm:text-3xl
            lg:text-4xl
            font-bold
            text-center
            mb-8
            font-poppins
            text-zinc-900
            dark:text-zinc-100
          "
          >
            Our Shell Collection
          </h1>
          {/* ⭐ LUXURY STORY SECTION (PLACE IT HERE) */}
          <div className="max-w-2xl mx-auto text-center mb-12">
            <h2
              className="
              font-playfair
              text-2xl
              sm:text-3xl
              lg:text-4xl
              tracking-tight
              mb-4
            "
            >
              Crafted by Nature, Refined by Hand
            </h2>
            <p className="text-zinc-600 max-w-xl mx-auto">
              Each shell is selected, polished, and transformed into a timeless art piece.
              Explore our curated luxury collection built with care and craftsmanship.
            </p>
          </div>
          <div className="
          grid gap-6
          grid-cols-1
          sm:grid-cols-2
          lg:grid-cols-3
          xl:grid-cols-4
        ">
            {products.map((product) => (
              <ProductFavorite
                key={product.id}
                product={product}
                onClick={() => handleProductClick(product)}
                isHighlighted={highlightedId === product.id}
                fromCenter={highlightedId === product.id && highlightFromCenter}
              />
            ))}
          </div>

          {selectedProduct && (
            <ProductCard product={selectedProduct} onClose={handleCloseModal} />
          )}
        </div>
      </div>
    </Layout>
  );
}





