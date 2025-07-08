// pages/products/[id].js
"use client";

import Layout from "@/components/Layout";
import { useRouter } from "next/router";
import { addToCart } from "@/redux/slices/cartSlice";
import { useDispatch } from "react-redux";
import ProductModal from "@/components/ProductCard";
import { getProductPaths } from "@/lib/static-data/getStaticPaths";
import { getProductStaticProps } from "@/lib/static-data/getStaticProps";

export const getStaticPaths = getProductPaths;
export const getStaticProps = getProductStaticProps;

export default function ProductDetail({ product }) {
    const router = useRouter();
    const dispatch = useDispatch();

    const handleAddToCart = () => {
        dispatch(addToCart(product));
    };

    const handleClose = () => {
        router.push("/products");
    };

    return (
        <Layout>
            <ProductModal
                product={product} 
                onClose={handleClose} 
                onAddToCart={handleAddToCart} 
            />
        </Layout>
    );
}

