export async function getProductsServerSideProps(context) {
    const res = await fetch('http://localhost:3000/api/products');
    const products = await res.json();
  
    return {
      props: {
        products,
      },
    };
  }
  