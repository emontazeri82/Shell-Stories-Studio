import { getAllProductIds } from '@/lib/db';

/**
 * Builds static paths for /products/[id] pages
 * Uses ISR fallback for new entries
 */
export async function getProductPaths() {
  try {
    const ids = await getAllProductIds();
    const validIds = Array.isArray(ids) ? ids : [];
    const paths = validIds.map((id) => ({
      params: { id: String(id) },
    }));

    return { paths, fallback: 'blocking' };
  } catch (err) {
    console.error('[getProductPaths] 💥 Error generating paths:', err);
    return { paths: [], fallback: 'blocking' };
  }
}

