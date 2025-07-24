// pages/api/admin/manage_products/index.js
// pages/api/admin/manage_products/index.js

import { insertProduct } from '@/lib/productApiUtils';
import { clearProductsCache } from '@/lib/cacheHelpers';
import { handleGetPaginatedProducts } from '@/lib/adminApiHandlers/getPaginatedProductsHandler';

export default async function handler(req, res) {
  if (req.method === 'POST') return handlePost(req, res);
  if (req.method === 'GET') return handleGetPaginatedProducts(req, res);
  return res.status(405).json({ error: 'Method Not Allowed' });
}

// 🔧 Handle Product Creation
async function handlePost(req, res) {
  const { name, price, category } = req.body;

  // ✅ Basic validation
  if (!name || !price || !category) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    const result = await insertProduct(req.body);
    const product = { id: result.lastID, ...req.body };

    // 🚫 Clear Redis cache after insertion
    await clearProductsCache();

    return res.status(201).json({ product });
  } catch (err) {
    console.error('❌ Insert Error:', err);
    return res.status(500).json({ error: 'Failed to create product' });
  }
}







