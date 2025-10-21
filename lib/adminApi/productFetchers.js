/**
 * Fetch paginated products from the admin API.
 * Frontend-safe wrapper used by React Query hooks.
 */

export async function fetchProducts({ page = 1, limit = 20, sortOrder = 'created_at_desc', q = '' }) {
  const query = new URLSearchParams({ page, limit, sort: sortOrder, q }).toString();
  const url = `/api/admin/manage_products?${query}`;
  const start = performance.now();

  console.log(`[FE] 🛠️ fetchProducts → ${url}`);

  try {
    const res = await fetch(url, {
      method: 'GET',
      credentials: 'include',
      headers: {
        Accept: 'application/json',
      },
    });

    const duration = Math.round(performance.now() - start);
    console.log(`[FE] fetchProducts HTTP ${res.status} in ${duration}ms`);

    // Try JSON safely
    let data;
    try {
      data = await res.json();
    } catch (e) {
      console.error('[FE] ⚠️ fetchProducts JSON parse error', e);
      throw new Error('Invalid JSON response from server');
    }

    // Check HTTP error
    if (!res.ok || !data.ok) {
      console.error('[FE] ❌ API error body:', data);
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    // Validate expected shape
    if (!Array.isArray(data.products)) {
      console.warn('[FE] ⚠️ Unexpected data shape:', data);
      data.products = [];
    }

    console.log(
      `[FE] ✅ Loaded ${data.products.length} products (total=${data.total}, pages=${data.totalPages})`
    );
    return data;
  } catch (err) {
    console.error('[FE] ❌ fetchProducts failed:', err);
    throw new Error(`Failed to load products: ${err.message}`);
  }
}

/**
 * Fetch a single product by ID (used in edit form).
 */
export async function fetchProductById(id) {
  if (!id) throw new Error('Product ID is required');

  const url = `/api/admin/manage_products/${id}`;
  const start = performance.now();

  console.log(`[FE] 🧩 fetchProductById → ${url}`);

  try {
    const res = await fetch(url, { method: 'GET', credentials: 'include' });
    const duration = Math.round(performance.now() - start);
    console.log(`[FE] fetchProductById HTTP ${res.status} in ${duration}ms`);

    const data = await res.json();
    if (!res.ok || !data.ok) {
      console.error('[FE] ❌ fetchProductById API error:', data);
      throw new Error(data?.error || `HTTP ${res.status}`);
    }

    return data.product || null;
  } catch (err) {
    console.error('[FE] ❌ fetchProductById failed:', err);
    throw new Error(`Failed to load product: ${err.message}`);
  }
}



  
  