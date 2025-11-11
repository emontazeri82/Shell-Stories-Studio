// /lib/cache.js
import { getRedisClient } from "@/lib/redis";
import { safeRedisKey } from "@/lib/redis/formatkey";

/**
 * 🧹 Invalidate all product caches
 */
export async function invalidateProductsCache() {
  try {
    const redis = await getRedisClient();
    const pattern = `${safeRedisKey(["products"])}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) {
      await redis.del(...keys);
      console.log(`[Redis] 🧹 Invalidated ${keys.length} product cache entries.`);
    } else {
      console.log("[Redis] No product cache keys found to invalidate.");
    }
  } catch (err) {
    console.warn("[Redis] ⚠️ Cache invalidation skipped:", err.message);
  }
}
