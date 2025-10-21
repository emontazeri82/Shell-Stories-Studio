// pages/api/admin/manage_products/[id].js
import { createAdminHandler } from '@/lib/middleware/createAdminHandler';
import {
  getProductById,
  updateProductById,
  deleteProductById,
} from '@/lib/productHelpers';
import {
  sendSuccessResponse,
  sendErrorResponse,
  validateProductData,
} from '@/lib/api';
import { getRedisClient } from '@/lib/redis';
import { updateProductStatus } from '@/lib/productApiUtils';
import { sanitizeProductFields } from '@/lib/utils/sanitizeProductFields';
import { safeRedisKey } from '@/lib/redis/formatkey';

// ---------- small helpers ----------
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const asInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};
const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const asTinyint = (v) => (Number(v) === 1 || v === true ? 1 : 0);

async function invalidateProductsCache() {
  try {
    const redis = await getRedisClient();
    const pattern = `${safeRedisKey(['products'])}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (e) {
    // non-fatal
    console.warn('⚠️ Redis invalidate skipped:', e?.message || e);
  }
}

const handler = createAdminHandler({
  rateLimit: { limit: 60, window: 60 },
});

// ---------- GET /api/admin/manage_products/:id ----------
handler.get(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, 'Invalid id');

  try {
    const product = await getProductById(idNum);
    if (!product) return sendErrorResponse(res, 404, 'Product not found');
    return sendSuccessResponse(res, 200, 'Product fetched successfully', {
      product,
    });
  } catch (err) {
    console.error('❌ Failed to fetch product by ID:', req.query.id, err);
    return sendErrorResponse(res, 500, 'Failed to fetch product');
  }
});

// ---------- PUT /api/admin/manage_products/:id ----------
// Partial update — only fields provided are patched.
handler.put(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, 'Invalid id');

  try {
    const current = await getProductById(idNum);
    if (!current) return sendErrorResponse(res, 404, 'Product not found');

    const input = req.body ?? {};
    // whitelist patchable fields
    const patch = {};

    if ('name' in input) patch.name = String(input.name);
    if ('description' in input) patch.description = String(input.description);
    if ('price' in input) patch.price = asNumber(input.price);
    if ('stock' in input) patch.stock = asInt(input.stock);
    if ('image_url' in input) patch.image_url = String(input.image_url || '');
    if ('image_public_id' in input)
      patch.image_public_id = String(input.image_public_id || '');
    if ('category' in input) patch.category = String(input.category || 'decor');
    if ('is_active' in input) patch.is_active = asTinyint(input.is_active);
    if ('is_favorite' in input) patch.is_favorite = asTinyint(input.is_favorite);

    // basic sanitization hook (no-op if your util just returns input)
    const sanitized = sanitizeProductFields
      ? sanitizeProductFields(patch)
      : patch;

    // validate *only* provided fields
    const hasKeys = Object.keys(sanitized).length > 0;
    if (!hasKeys) return sendErrorResponse(res, 400, 'Nothing to update');

    const validationError = validateProductData(sanitized);
    if (validationError) return sendErrorResponse(res, 400, validationError);

    // apply update
    const result = await updateProductById(idNum, sanitized);
    if (!result || result.changes === 0) {
      return sendErrorResponse(res, 404, 'Product not found');
    }

    await invalidateProductsCache();

    return sendSuccessResponse(res, 200, 'Product updated successfully', {
      product: { id: idNum, ...sanitized },
    });
  } catch (err) {
    console.error('❌ Failed to update:', err);
    return sendErrorResponse(res, 500, 'Failed to update product');
  }
});

// ---------- DELETE /api/admin/manage_products/:id ----------
handler.delete(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, 'Invalid id');

  try {
    const result = await deleteProductById(idNum);
    if (!result || result.changes === 0) {
      return sendErrorResponse(res, 404, 'Product not found');
    }

    await invalidateProductsCache();

    return sendSuccessResponse(res, 200, 'Product deleted successfully');
  } catch (err) {
    console.error('❌ Failed to delete product:', err);
    return sendErrorResponse(res, 500, 'Failed to delete product');
  }
});

// ---------- PATCH /api/admin/manage_products/:id ----------
// Dedicated quick-toggle for is_active only.
handler.patch(async (req, res) => {
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, 'Invalid id');

  const { is_active } = req.body ?? {};
  const toggle = Number(is_active);
  if (!Number.isFinite(toggle))
    return sendErrorResponse(res, 400, 'Missing or invalid is_active');

  try {
    await updateProductStatus(idNum, asTinyint(toggle));
    await invalidateProductsCache();
    return sendSuccessResponse(res, 200, 'Status updated', { success: true });
  } catch (error) {
    console.error('❌ Failed to update status:', error);
    return sendErrorResponse(res, 500, 'Internal Server Error');
  }
});

export default handler;






