// pages/products/index.js
"use client";

import { useState } from "react";
import Layout from "@/components/Layout";
import ProductModal from "@/components/product/ProductCard";
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
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8 font-poppins">
          Our Shell Collection
        </h1>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
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
          <ProductModal product={selectedProduct} onClose={handleCloseModal} />
        )}
      </div>
    </Layout>
  );
}





