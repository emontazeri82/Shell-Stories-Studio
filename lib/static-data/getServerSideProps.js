import { getAllProductsSummary } from '@/lib/db';

/**
 * Server-side data fetch for all products
 * Used when you need dynamic data (not ISR cached)
 */
export async function getProductsServerSideProps() {
  try {
    const products = await getAllProductsSummary();
    return {
      props: { products: products || [] },
    };
  } catch (err) {
    console.error('[getProductsServerSideProps] 💥 DB error:', err);
    return {
      props: { products: [] },
    };
  }
}

  
  