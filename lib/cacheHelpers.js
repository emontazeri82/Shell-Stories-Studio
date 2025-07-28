// lib/cacheHelpers.js
import { getRedisClient } from './redis';
import { safeRedisKey } from './redis/formatkey';

export async function clearProductsCache() {
  try {
    const redis = await getRedisClient();
    //const keys = await redis.keys('products:*');
    //const pattern = safeRedisKey(['products', '*']); // still safe
    const pattern = `${safeRedisKey(['products'])}:*`;  // ✅ FIXED
    const keys = await redis.keys(pattern);
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log('🧹 Redis cache cleared:', keys);
    }
  } catch (e) {
    console.warn('⚠️ Redis cache clear failed:', e);
  }
}
