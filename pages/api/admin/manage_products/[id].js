// pages/api/admin/manage_products/[id].js
import { getProductById, updateProductById, deleteProductById } from '@/lib/productHelpers';
import { sendSuccessResponse, sendErrorResponse, validateProductData } from '@/lib/api';
import { getRedisClient } from '@/lib/redis';
import { updateProductStatus } from '@/lib/productApiUtils';

export default async function handler(req, res) {
    const { id } = req.query;

    if (req.method === 'GET') {
        try {
            const product = await getProductById(id);
            if (!product) {
                return sendErrorResponse(res, 404, 'Product not found');
            }
            sendSuccessResponse(res, 200, 'Product fetched successfully', { product });
        } catch (err) {
            console.error('❌ Failed to fetch product by ID:', id, err);
            console.error(err);
            sendErrorResponse(res, 500, 'Failed to fetch product');
        }

    } else if (req.method === 'PUT') {
        try {
            console.log('⬅️ Received update data:', req.body);
            const updateData = req.body;

            // ✅ Fetch current product
            const current = await getProductById(id);
            if (!current) {
                return sendErrorResponse(res, 404, 'Product not found');
            }

            // ✅ Merge updates over current values
            const merged = { ...current, ...updateData };

            // ✅ Optional: Set updated_at
            merged.updated_at = new Date().toISOString();

            // ✅ Validate full merged product
            const validationError = validateProductData(merged);
            if (validationError) {
                return sendErrorResponse(res, 400, validationError);
            }

            const result = await updateProductById(id, merged);

            if (result.changes === 0) {
                return sendErrorResponse(res, 404, 'Product not found');
            }

            // ✅ Invalidate Redis cache after update
            try {
                const redis = await getRedisClient();
                const keys = await redis.keys('products:*');
                if (keys.length > 0) {
                    await redis.del(...keys);
                    console.log('♻️ Redis cache invalidated after PUT');
                }
            } catch (e) {
                console.warn('⚠️ Redis unavailable or flush failed (PUT):', e);
            }

            sendSuccessResponse(res, 200, 'Product updated successfully');
        } catch (err) {
            console.error('❌ Failed to update:', err);
            return sendErrorResponse(res, 500, 'Failed to update product');
        }
    } else if (req.method === 'DELETE') {
        try {
            console.log("🧪 Deleting product ID from query:", id);
            const result = await deleteProductById(id);

            if (result.changes === 0) {
                return sendErrorResponse(res, 404, 'Product not found');
            }
            // ✅ Invalidate Redis cache
            try {
                const redis = await getRedisClient();
                const keys = await redis.keys('products:*');
                if (keys.length > 0) {
                    await redis.del(...keys); // deletes only product cache
                }

            } catch (e) {
                console.warn('⚠️ Redis unavailable or flush failed:', e);
            }

            return sendSuccessResponse(res, 200, 'Product deleted successfully');
        } catch (err) {
            console.error(err);
            return sendErrorResponse(res, 500, 'Failed to delete product');
        }

    } else if (req.method === 'PATCH') {
        const { is_active } = req.body;
        console.log('🛠️ PATCH called:', id, is_active);

        if (typeof is_active !== 'number') {
            return res.status(400).json({ error: 'Missing or invalid is_active' });
        }

        try {
            await updateProductStatus(id, is_active);
            // ✅ Invalidate Redis cache after successful update
            try {
                const redis = await getRedisClient();
                const keys = await redis.keys('products:*');
                if (keys.length > 0) {
                    await redis.del(...keys);
                    console.log('♻️ Redis cache invalidated after PATCH');
                }
            } catch (e) {
                console.warn('⚠️ Redis unavailable or flush failed (PATCH):', e);
            }

            return res.status(200).json({ success: true });
        } catch (error) {
            console.error('❌ Failed to update status:', error);
            return res.status(500).json({ error: 'Internal Server Error' });
        }
    } else {
        return sendErrorResponse(res, 405, 'Method Not Allowed');
    }
}



