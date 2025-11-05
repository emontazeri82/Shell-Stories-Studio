// /lib/middleware/rateLimiter.js
import { getRedisClient } from "@/lib/redis";

/**
 * rateLimiter(req, res, next, options)
 * ------------------------------------
 * Universal Redis-based rate limiter with built-in debug logs.
 * Automatically bypasses when Redis is unavailable.
 */
export async function rateLimiter(req, res, next, options = {}) {
  const rid = req.rid || Math.random().toString(36).slice(2, 8);
  const ip =
    req.headers["x-forwarded-for"]?.split(",")[0]?.trim() ||
    req.socket?.remoteAddress ||
    "unknown";

  const limit = Number(options.limit || 60);
  const windowSeconds = Number(options.window || 60);
  const key = `rate-limit:${ip}`;

  console.log(
    `[rateLimiter] [${rid}] ▶ Checking limit for ${ip} (limit=${limit}, window=${windowSeconds}s)`
  );

  try {
    const redis = await getRedisClient();
    if (!redis) {
      console.warn(`[rateLimiter] [${rid}] ⚠️ Redis unavailable — allowing request`);
      return next();
    }

    // Use Redis INCR/EXPIRE combo to track counts atomically
    const count = await redis.incr(key);

    // Set expiry for this key if it's the first increment
    if (count === 1) {
      await redis.expire(key, windowSeconds);
      console.log(`[rateLimiter] [${rid}] 🆕 Key initialized (${windowSeconds}s window)`);
    }

    // Set helpful headers for client
    res.setHeader("X-RateLimit-Limit", limit);
    res.setHeader("X-RateLimit-Remaining", Math.max(0, limit - count));
    res.setHeader("X-RateLimit-Reset", windowSeconds);

    // Enforce rate limit
    if (count > limit) {
      console.warn(`[rateLimiter] [${rid}] 🚫 Rate limit exceeded (${count}/${limit})`);
      if (!res.headersSent) {
        return res
          .status(429)
          .json({
            success: false,
            error: "Too many requests. Please try again later.",
            retryAfter: windowSeconds,
          });
      }
      return;
    }

    console.log(`[rateLimiter] [${rid}] ✅ Allowed (${count}/${limit})`);
    return next();
  } catch (err) {
    console.error(`[rateLimiter] [${rid}] 💥 Redis or limiter error:`, err);
    console.warn(`[rateLimiter] [${rid}] ⚠️ Allowing request to proceed safely`);
    return next(); // ✅ fail open (never block on Redis failure)
  }
}
