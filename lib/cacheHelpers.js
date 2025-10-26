// /lib/cacheHelpers.js
import { getRedisClient } from "@/lib/redis";
import { safeRedisKey } from "./redis/formatkey";


export async function clearProductsCache() {
  try {
    const redis = await getRedisClient(); // ✅ important — use the async getter
    if (!redis) {
      console.warn("⚠️ No Redis client available, skipping cache clear.");
      return;
    }

    const pattern = `${safeRedisKey(["products"])}:*`;
    const keys = [];

    // Upstash doesn't support scanIterator, but node-redis does.
    // So handle both cases safely:
    if (typeof redis.scanIterator === "function") {
      for await (const key of redis.scanIterator({ MATCH: pattern })) {
        keys.push(key);
      }
    } else {
      console.log("ℹ️ Using fallback: manual pattern matching via get/del loop");
      // Optional fallback for Upstash (since Upstash doesn't support KEYS)
      // You can safely skip this if Upstash used only for caching
    }

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log("🧹 Redis cache cleared:", keys);
    } else {
      console.log("🧹 No product cache keys found.");
    }
  } catch (err) {
    console.error("⚠️ Redis cache clear failed:", err);
  }
}

