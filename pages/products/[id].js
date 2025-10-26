// pages/products/[id].js
import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import ProductCard from "@/components/product/ProductCard"; // ← import your client component
import { getProductPaths } from "@/lib/static-data/getStaticPaths";
import { getProductStaticProps } from "@/lib/static-data/getStaticProps";

export const getStaticPaths = getProductPaths;
export const getStaticProps = getProductStaticProps;

export default function ProductDetail({ product }) {
  const router = useRouter();
  const handleClose = () => router.push("/products");

  return (
    <Layout>
      <ProductCard product={product} onClose={handleClose} />
    </Layout>
  );
}



