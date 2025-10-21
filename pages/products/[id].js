// pages/products/[id].js
"use client";

import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import ProductModal from "@/components/product/ProductCard";
import { getProductPaths } from "@/lib/static-data/getStaticPaths";
import { getProductStaticProps } from "@/lib/static-data/getStaticProps";

export const getStaticPaths = getProductPaths;
export const getStaticProps = getProductStaticProps;

export default function ProductDetail({ product }) {
  const router = useRouter();

  const handleClose = () => {
    router.push("/products");
  };

  return (
    <Layout>
      <ProductModal product={product} onClose={handleClose} />
    </Layout>
  );
}


