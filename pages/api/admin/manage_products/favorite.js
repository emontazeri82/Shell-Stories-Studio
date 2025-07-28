import { openDB } from '@/lib/db';
import { getRedisClient } from '@/lib/redis';
import { sendErrorResponse, sendSuccessResponse } from '@/lib/api';
import { createAdminHandler } from '@/lib/middleware/createAdminHandler';
import { sanitizeFavoriteToggle } from '@/lib/utils/sanitizeFavoriteToggle';
import { safeRedisKey } from '@/lib/redis/formatkey';

const handler = createAdminHandler();

// ⭐ Toggle favorite status
handler.post(async (req, res) => {
  const { sanitized, error } = sanitizeFavoriteToggle(req.body);

  if (error) {
    return sendErrorResponse(res, 400, error);
  }

  const { productId, is_favorite } = sanitized;

  const db = await openDB();

  try {
    const currentFavoriteCount = await db.get(
      `SELECT COUNT(*) as count FROM products WHERE is_favorite = 1`
    );

    if (currentFavoriteCount.count >= 8 && is_favorite === 1) {
      return sendErrorResponse(res, 400, 'You can only have 8 favorite products.');
    }

    await db.run(`UPDATE products SET is_favorite = ? WHERE id = ?`, [is_favorite, productId]);

    // ♻️ Invalidate Redis product cache
    try {
      const redis = await getRedisClient();
      // safeRedisKey - Use to build exact Redis key names
      // ❗ DO NOT use with wildcards (*), append wildcards manually if needed
      const pattern = `${safeRedisKey(['products'])}:*`;
      const keys = await redis.keys(pattern);
      if (keys.length > 0) {
        await redis.del(...keys);
        console.log('♻️ Redis cache invalidated after favorite update');
      }
    } catch (flushErr) {
      console.warn('⚠️ Redis flush failed:', flushErr);
    }

    return sendSuccessResponse(
      res,
      200,
      `Product ${is_favorite ? 'marked as' : 'unmarked as'} favorite successfully.`
    );
  } catch (err) {
    console.error('❌ Favorite Toggle Error:', err);
    return sendErrorResponse(res, 500, 'Failed to update favorite status');
  }
});

export default handler;



