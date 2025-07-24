// Search products by query (optional, could also be filtered client-side)
export async function searchProducts(query) {
    const res = await fetch(`/api/admin/manage_products/search?query=${encodeURIComponent(query)}`);
    if (!res.ok) {
      throw new Error('Search failed');
    }
  
    return res.json();
  }
  