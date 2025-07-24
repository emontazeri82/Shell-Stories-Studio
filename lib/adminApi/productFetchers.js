// Fetch all products
export async function fetchProducts({ sortOrder }) {
    const timestamp = Date.now(); // 👈 to prevent reuse of cached data

    const params = new URLSearchParams({
      page: 1,
      limit: 20,
      sort: sortOrder,
      t: timestamp.toString(),
    });
    const res = await fetch(`/api/admin/manage_products?${params}`);

    if (!res.ok) throw new Error('Failed to fetch products');
    return res.json();
  }
  
  