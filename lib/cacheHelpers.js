// lib/cacheHelpers.js
import { getRedisClient } from './redis';

export async function clearProductsCache() {
  try {
    const redis = await getRedisClient();
    const keys = await redis.keys('products:*');
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log('🧹 Redis cache cleared:', keys);
    }
  } catch (e) {
    console.warn('⚠️ Redis cache clear failed:', e);
  }
}
