// pages/api/admin/manage_products/index.js
import { createAdminHandler } from '@/lib/middleware/createAdminHandler';
import { insertProduct } from '@/lib/productApiUtils';
import { clearProductsCache } from '@/lib/cacheHelpers';
import { handleGetPaginatedProducts } from '@/lib/adminApiHandlers/getPaginatedProductsHandler';
import { sendErrorResponse } from '@/lib/api';
import { sanitizeProductFields } from '@/lib/utils/sanitizeProductFields';
import { validateProductData, sendSuccessResponse } from '@/lib/api';

const handler = createAdminHandler({
  rateLimit: { limit: 60, window: 60 } // Optional: customize rate limit per route
});

// 🧾 GET: Paginated Products
handler.get(async (req, res) => {
  return handleGetPaginatedProducts(req, res);
});

// ➕ POST: Create Product
handler.post(async (req, res) => {
  const rawProduct = req.body;

  const sanitized = sanitizeProductFields(rawProduct);
  const validationError = validateProductData(sanitized);

  if (validationError) {
    return sendErrorResponse(res, 400, validationError);
  }

  try {
    const result = await insertProduct(sanitized);
    const product = { id: result.lastID, ...sanitized };

    await clearProductsCache();

    return sendSuccessResponse(res, 201, 'Product created successfully', { product });
  } catch (err) {
    console.error('❌ Insert Error:', err);
    return sendErrorResponse(res, 500, 'Failed to create product');
  }
});

export default handler;








