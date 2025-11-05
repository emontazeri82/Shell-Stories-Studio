import { openDB } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { sendErrorResponse, sendSuccessResponse } from '@/lib/api';
import { createAdminHandler } from '@/lib/middleware/createAdminHandler';
import { sanitizeFavoriteToggle } from '@/lib/utils/sanitizeFavoriteToggle';
import { safeRedisKey } from '@/lib/redis/formatkey';
import { ADMIN_FAVORITES_MAX } from '@/lib/constant';

const handler = createAdminHandler();

// ⭐ Toggle favorite status
handler.post(async (req, res) => {
  const { sanitized, error } = sanitizeFavoriteToggle(req.body);
  if (error) {
    return sendErrorResponse(res, 400, error);
  }

  const { productId, is_favorite } = sanitized;
  const id = productId;  // for clarity

  const db = await openDB();

  try {
    const currentFavoriteCount = await db.get(
      `SELECT COUNT(*) AS count FROM products WHERE is_favorite = 1`
    );

    if (currentFavoriteCount.count >= ADMIN_FAVORITES_MAX && is_favorite === 1) {
      return sendErrorResponse(res, 400,
        `You can only have ${ADMIN_FAVORITES_MAX} favorite products.`);
    }

    const result = await db.run(
      `UPDATE products SET is_favorite = ? WHERE id = ?`,
      [is_favorite, id]
    );

    // Check if any row was actually updated
    if (!result || result.changes === 0) {
      console.warn(`⚠️ Favorite toggle: no rows updated for id=${id}`);
      return sendErrorResponse(res, 404, 'Product not found or no change needed.');
    }

    // Invalidate Redis cache if needed
    try {
      const redis = await getRedisClient();
      const pattern = `${safeRedisKey(['products'])}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log('♻️ Redis cache invalidated after favorite update');
      }
    } catch (flushErr) {
      console.warn('⚠️ Redis flush failed:', flushErr);
    }

    return sendSuccessResponse(res, 200,
      `Product ${is_favorite ? 'marked as' : 'unmarked as'} favorite successfully.`,
      { ok: true, productId: id, isFavorite: is_favorite });
  } catch (err) {
    console.error('❌ Favorite Toggle Error:', err);
    return sendErrorResponse(res, 500, 'Failed to update favorite status');
  }
});


export default handler;



