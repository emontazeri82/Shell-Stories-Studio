
// pages/api/admin/manage_products/[id].js
import { createAdminHandler } from '@/lib/middleware/createAdminHandler';
import { getProductById, updateProductById, deleteProductById } from '@/lib/productHelpers';
import { sendSuccessResponse, sendErrorResponse, validateProductData } from '@/lib/api';
import { getRedisClient } from '@/lib/redis';
import { updateProductStatus } from '@/lib/productApiUtils';
import { sanitizeProductFields } from '@/lib/utils/sanitizeProductFields';
import { safeRedisKey } from '@/lib/redis/formatkey';

const handler = createAdminHandler({
  rateLimit: { limit: 60, window: 60 },
});

// 📦 GET product by ID
handler.get(async (req, res) => {
  const { id } = req.query;
  try {
    const product = await getProductById(id);
    if (!product) {
      return sendErrorResponse(res, 404, 'Product not found');
    }
    return sendSuccessResponse(res, 200, 'Product fetched successfully', { product });
  } catch (err) {
    console.error('❌ Failed to fetch product by ID:', id, err);
    return sendErrorResponse(res, 500, 'Failed to fetch product');
  }
});

// 📝 PUT update product
handler.put(async (req, res) => {
  const { id } = req.query;
  try {
    console.log('⬅️ Received update data:', req.body);
    const updateData = req.body;
    const current = await getProductById(id);
    if (!current) {
      return sendErrorResponse(res, 404, 'Product not found');
    }

    const merged = { ...current, ...updateData, updated_at: new Date().toISOString() };
    const cleanProduct = sanitizeProductFields(merged);

    const validationError = validateProductData(cleanProduct);
    if (validationError) {
      return sendErrorResponse(res, 400, validationError);
    }

    const result = await updateProductById(id, cleanProduct);
    if (result.changes === 0) {
      return sendErrorResponse(res, 404, 'Product not found');
    }

    // 🧹 Redis cache invalidation
    try {
      const redis = await getRedisClient();
      const allKeys = await redis.keys('*');
      console.log('🗝️ All Redis keys in Redis:', allKeys);

      //const pattern = safeRedisKey(['products', '*']);
      const pattern = `${safeRedisKey(['products'])}:*`;
      console.log('🔍 Pattern used:', pattern);

      const matchingKeys = await redis.keys(pattern);
      console.log('🔑 Matching keys to delete:', matchingKeys);

      if (matchingKeys.length > 0) {
        await redis.del(...matchingKeys);
        console.log('♻️ Redis cache invalidated');
      } else {
        console.log('⚠️ No matching Redis keys to delete');
      }
    } catch (e) {
      console.warn('⚠️ Redis unavailable or flush failed:', e);
    }

    return sendSuccessResponse(res, 200, 'Product updated successfully');
  } catch (err) {
    console.error('❌ Failed to update:', err);
    return sendErrorResponse(res, 500, 'Failed to update product');
  }
});

// ❌ DELETE product
handler.delete(async (req, res) => {
  const { id } = req.query;
  try {
    console.log("🧪 Deleting product ID from query:", id);
    const result = await deleteProductById(id);
    if (result.changes === 0) {
      return sendErrorResponse(res, 404, 'Product not found');
    }

    try {
      const redis = await getRedisClient();
      const allKeys = await redis.keys('*');
      console.log('🗝️ All Redis keys in Redis:', allKeys);

      //const pattern = safeRedisKey(['products', '*']);
      const pattern = `${safeRedisKey(['products'])}:*`;
      console.log('🔍 Pattern used:', pattern);

      const matchingKeys = await redis.keys(pattern);
      console.log('🔑 Matching keys to delete:', matchingKeys);

      if (matchingKeys.length > 0) {
        await redis.del(...matchingKeys);
        console.log('♻️ Redis cache invalidated');
      } else {
        console.log('⚠️ No matching Redis keys to delete');
      }
    } catch (e) {
      console.warn('⚠️ Redis unavailable or flush failed:', e);
    }

    return sendSuccessResponse(res, 200, 'Product deleted successfully');
  } catch (err) {
    console.error(err);
    return sendErrorResponse(res, 500, 'Failed to delete product');
  }
});

// 🔁 PATCH is_active
handler.patch(async (req, res) => {
  const { id } = req.query;
  const { is_active } = req.body;
  console.log('🛠️ PATCH called:', id, is_active);

  if (typeof is_active !== 'number') {
    return res.status(400).json({ error: 'Missing or invalid is_active' });
  }

  try {
    await updateProductStatus(id, is_active);

    try {
      const redis = await getRedisClient();
      const allKeys = await redis.keys('*');
      console.log('🗝️ All Redis keys in Redis:', allKeys);

      //const pattern = safeRedisKey(['products', '*']);
      const pattern = `${safeRedisKey(['products'])}:*`;
      console.log('🔍 Pattern used:', pattern);

      const matchingKeys = await redis.keys(pattern);
      console.log('🔑 Matching keys to delete:', matchingKeys);

      if (matchingKeys.length > 0) {
        await redis.del(...matchingKeys);
        console.log('♻️ Redis cache invalidated');
      } else {
        console.log('⚠️ No matching Redis keys to delete');
      }
    } catch (e) {
      console.warn('⚠️ Redis unavailable or flush failed:', e);
    }

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error('❌ Failed to update status:', error);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
});

export default handler;




