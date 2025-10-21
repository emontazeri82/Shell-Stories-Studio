// lib/productFetchers.js (or wherever you fetch)
export async function fetchProducts({ page=1, limit=20, sort='created_at_desc', q='' }) {
  const url = `/api/admin/manage_products?${new URLSearchParams({ page, limit, sort, q })}`;
  console.log('[FE] fetchProducts →', url);
  const t0 = performance.now();

  const res = await fetch(url, { credentials: 'include' }).catch(err => {
    console.error('[FE] fetchProducts network error:', err);
    throw err;
  });

  const t1 = performance.now();
  console.log('[FE] fetchProducts HTTP', res.status, 'in', Math.round(t1 - t0), 'ms');

  let body;
  try {
    body = await res.json();
  } catch (e) {
    const text = await res.text().catch(()=>'');
    console.error('[FE] fetchProducts bad JSON, text:', text.slice(0, 200));
    throw e;
  }

  console.log('[FE] fetchProducts body keys:', Object.keys(body));
  if (!res.ok || body?.ok === false) {
    console.error('[FE] fetchProducts API error:', body);
    throw new Error(body?.error || `HTTP ${res.status}`);
  }
  return body;
}

  
  