// lib/static-data/getStaticProps.js
import {
  getProductWithMediaById,
  getAllProductsForList,
} from '@/lib/db';

// For the product detail page: /products/[id]
export async function getProductStaticProps({ params }) {
  const id = Number(params?.id);
  if (!Number.isFinite(id)) {
    return { notFound: true };
  }

  const product = await getProductWithMediaById(id);
  if (!product) {
    return { notFound: true };
  }

  return {
    props: { product },      // product.media is included here
    revalidate: 60,          // ISR: re-generate every 60s
  };
}

// For the listing page: /products
export async function getProductsStaticProps() {
  // returns only active products + a computed thumbnail_url
  const products = await getAllProductsForList();

  return {
    props: { products },
    revalidate: 60,
  };
}

