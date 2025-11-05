import {
  getProductWithMediaById,
  getAllProductsForList,
} from '@/lib/db';

/**
 * Static props for /products/[id] — individual product page.
 */
export async function getProductStaticProps({ params }) {
  try {
    const id = Number(params?.id);
    if (!Number.isFinite(id)) {
      console.warn('[getProductStaticProps] ⚠️ Invalid product ID param:', params?.id);
      return { notFound: true };
    }

    const product = await getProductWithMediaById(id);
    if (!product) {
      console.warn('[getProductStaticProps] ⚠️ No product found for ID:', id);
      return { notFound: true };
    }

    return {
      props: { product },
      revalidate: 60,
    };
  } catch (err) {
    console.error('[getProductStaticProps] 💥 DB error:', err);
    return { notFound: true };
  }
}

/**
 * Static props for /products — product list page.
 */
export async function getProductsStaticProps() {
  try {
    const products = await getAllProductsForList();
    return {
      props: { products: products || [] },
      revalidate: 60,
    };
  } catch (err) {
    console.error('[getProductsStaticProps] 💥 Error fetching products:', err);
    return {
      props: { products: [] },
      revalidate: 60,
    };
  }
}
