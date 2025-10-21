// lib/static-data/getStaticPaths.js
import { getAllProductIds } from '@/lib/db';

export async function getProductPaths() {
  try {
    // Returns an array of numeric IDs for active products
    const ids = await getAllProductIds();

    const paths = ids.map((id) => ({
      params: { id: String(id) },
    }));

    return {
      paths,
      // 'blocking' lets Next build pages on-demand for new IDs, then cache them
      fallback: 'blocking',
    };
  } catch (err) {
    console.error('getProductPaths error:', err);
    // Fallback to no prebuilt paths but still allow on-demand generation
    return { paths: [], fallback: 'blocking' };
  }
}


