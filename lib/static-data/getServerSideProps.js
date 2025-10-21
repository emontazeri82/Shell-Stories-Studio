// lib/static-data/getServerSideProps.js
import { getAllProductsSummary } from '@/lib/db';

export async function getProductsServerSideProps() {
  const products = await getAllProductsSummary(); 
  // Each product will have image_url populated (legacy or primary media fallback)
  return {
    props: { products },
  };
}

  
  