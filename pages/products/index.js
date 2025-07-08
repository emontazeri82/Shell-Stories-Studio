"use client";

import { useEffect, useState } from "react";
import { useDispatch } from "react-redux";
import { fetchProducts } from "@/redux/slices/productsSlice";
import { addToCart } from "@/redux/slices/cartSlice";
import { useRouter } from "next/router";
import Layout from "@/components/Layout";
import ProductModal from "@/components/ProductCard";
import ProductFavorite from "@/components/ProductFavorite";
import { toast } from "react-hot-toast";
import { getProductsServerSideProps } from "@/lib/static-data/getServerSideProps";
import { useScrollToHighlightedProduct } from "@/hooks/useScrollToHighlightedProduct";

export const getServerSideProps = getProductsServerSideProps;

export default function ProductsPage({ products }) {
  const dispatch = useDispatch();
  const router = useRouter();

  const [selectedProduct, setSelectedProduct] = useState(null);
  const [highlightedId, setHighlightedId] = useState(null);
  const [highlightFromCenter, setHighlightFromCenter] = useState(null);

  // Fetch all products on mount
  useEffect(() => {
    dispatch(fetchProducts());
  }, [dispatch]);

  // Auto-scroll to image from URL if needed
  useScrollToHighlightedProduct({
    setHighlightedId,
    setHighlightFromCenter,
  });

  // Open modal when clicking a product
  const handleProductClick = (product) => {
    setSelectedProduct(product);
    setHighlightedId(null);
    router.push(`/products?id=${product.id}`, undefined, { shallow: true });
  };

  // Close modal and clear query param
  const handleCloseModal = () => {
    setSelectedProduct(null);
    router.replace("/products", undefined, { shallow: true });
  };

  return (
    <Layout>
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-center mb-8">
          Our Shell Collection
        </h1>

        <div className="grid gap-6 grid-cols-1 sm:grid-cols-2 md:grid-cols-3">
          {products.map((product) => (
            <ProductFavorite
              key={product.id}
              product={product}
              onClick={() => handleProductClick(product)}
              isHighlighted={highlightedId === product.id}
              highlightFromCenter={highlightFromCenter === product.id}
            />
          ))}
        </div>
      </div>

      {selectedProduct && (
        <ProductModal
          product={selectedProduct}
          onClose={handleCloseModal}
          onAddToCart={() => {
            dispatch(addToCart(selectedProduct));
            toast.success("✅ Added to cart");
          }}
        />
      )}
    </Layout>
  );
}




