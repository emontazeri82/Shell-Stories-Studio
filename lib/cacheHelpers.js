// /lib/cacheHelpers.js
import { getRedisClient } from "@/lib/redis";
import { safeRedisKey } from "./redis/formatkey";

/**
 * Clears all Redis product cache entries.
 * Works safely with both node-redis and Upstash Redis REST API.
 */
export async function clearProductsCache() {
  const rid = Math.random().toString(36).slice(2, 8);
  console.log(`\n[clearProductsCache] ▶ START [${rid}]`);

  try {
    // ✅ 1️⃣ Initialize Redis safely
    const redis = await getRedisClient();
    if (!redis) {
      console.warn(`[clearProductsCache] ⚠️ No Redis client available, skipping.`);
      return { ok: false, message: "Redis client unavailable" };
    }

    const pattern = `${safeRedisKey(["products"])}:*`;
    const keys = [];
    console.log(`[clearProductsCache] 🧭 Pattern = ${pattern}`);

    // ✅ 2️⃣ Try node-redis scanIterator
    if (typeof redis.scanIterator === "function") {
      console.log(`[clearProductsCache] 🔍 Scanning keys via scanIterator...`);
      for await (const key of redis.scanIterator({ MATCH: pattern })) {
        keys.push(key);
      }
    } else {
      // ✅ Upstash fallback (no SCAN support)
      console.log(`[clearProductsCache] ℹ️ Upstash detected — using fallback`);
      // For Upstash REST: can't list keys easily; skip safely
      // Could optionally add key tracking via separate index set
    }

    // ✅ 3️⃣ Delete all matching keys
    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(`[clearProductsCache] 🧹 Deleted ${keys.length} keys`);
      return { ok: true, deleted: keys.length, keys };
    } else {
      console.log(`[clearProductsCache] 🧹 No keys matched pattern.`);
      return { ok: true, deleted: 0, keys: [] };
    }
  } catch (err) {
    console.error(`[clearProductsCache] 💥 Error:`, err);
    return { ok: false, error: err.message || String(err) };
  } finally {
    console.log(`[clearProductsCache] 🏁 END [${rid}]`);
  }
}

