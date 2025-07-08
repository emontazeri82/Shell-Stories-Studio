// lib/static-data/getStaticProps.js
import { getProductById, getAllProducts } from '@/lib/db';

export async function getProductStaticProps({ params }) {
  const product = await getProductById(params.id);

  if (!product) {
    return { notFound: true };
  }

  return {
    props: { product },
    revalidate: 60 // re-generate the page every 60 seconds
  };
}
 // For the listing page: /products
export async function getProductsStaticProps() {
    const products = await getAllProducts();
  
    return {
      props: {
        products
      },
      revalidate: 60 // Rebuild every 60 seconds
    };
  }
