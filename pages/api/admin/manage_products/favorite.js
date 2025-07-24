// pages/api/admin/manage_products/favorite.js
import { openDB } from '@/lib/db';
import { getRedisClient } from '@/lib/redis'; // ⬅️ Add this if you haven't already

export default async function handler(req, res) {
  const { productId, isFavorite } = req.body;
  const db = await openDB();

  try {
    const currentFavoriteCount = await db.get(
      `SELECT COUNT(*) as count FROM products WHERE is_favorite = 1`
    );

    if (currentFavoriteCount.count >= 8 && isFavorite === 1) {
      return res.status(400).json({ error: 'You can only have 8 favorite products.' });
    }

    await db.run(`UPDATE products SET is_favorite = ? WHERE id = ?`, [isFavorite, productId]);

    // ✅ Flush Redis cache after update
    try {
      const redis = await getRedisClient();
      const keys = await redis.keys('products:*');
      if (keys.length > 0) {
        await redis.del(...keys);
      }

    } catch (flushErr) {
      console.warn('⚠️ Redis flush failed:', flushErr);
    }

    res.status(200).json({ message: `Product ${isFavorite ? 'marked as' : 'unmarked as'} favorite successfully.` });
  } catch (err) {
    console.error('❌ Favorite Toggle Error:', err);
    res.status(500).json({ error: 'Failed to update favorite status' });
  }
}

