// lib/static-data/getStaticPaths.js
import { getAllProducts } from '@/lib/db';

export async function getProductPaths() {
  const products = await getAllProducts();

  const paths = products.map(product => ({
    params: { id: product.id.toString() }
  }));

  return {
    paths,
    fallback: 'blocking' // or 'false' if all IDs are known
  };
}

