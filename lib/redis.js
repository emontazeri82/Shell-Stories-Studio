// /lib/redis.js
let client = null;

/* ──────────────────────────────
 * Helper: Normalize set() options
 * ────────────────────────────── */
function normalizeSetOpts(opts = {}) {
  if (!opts) return undefined;
  const ex = opts.ex ?? opts.EX ?? undefined;
  const px = opts.px ?? opts.PX ?? undefined;
  const out = {};
  if (ex != null) out.ex = ex;
  if (px != null) out.px = px;
  return Object.keys(out).length ? out : undefined;
}

/* ──────────────────────────────
 * Wrapper: Upstash REST API
 * ────────────────────────────── */
function wrapUpstash(upstash) {
  return {
    get: (k) => upstash.get(k),
    set: (k, v, opts) => upstash.set(k, v, normalizeSetOpts(opts)),
    del: (k) => upstash.del(k),
    incr: (k) => upstash.incr(k),
    expire: (k, s) => upstash.expire(k, s),
    keys: async (pattern) => {
      console.warn("⚠️ Upstash does not support KEYS command directly — returning empty array.");
      return [];
    },
  };
}

/* ──────────────────────────────
 * Wrapper: Node Redis (TCP)
 * ────────────────────────────── */
function wrapTcp(nodeClient) {
  return {
    get: (k) => nodeClient.get(k),
    set: (k, v, opts) => nodeClient.set(k, v, normalizeSetOpts(opts)),
    del: (k) => nodeClient.del(k),
    incr: (k) => nodeClient.incr(k),
    expire: (k, s) => nodeClient.expire(k, s),
    keys: (pattern) => nodeClient.keys(pattern),
  };
}

/* ──────────────────────────────
 * Singleton: Get Redis client
 * ────────────────────────────── */
export async function getRedisClient() {
  if (client) return client;

  // ──────────────────────────────
  // 1️⃣ Prefer Upstash REST client
  // ──────────────────────────────
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    try {
      const { Redis } = await import("@upstash/redis");
      const upstash = new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL,
        token: process.env.UPSTASH_REDIS_REST_TOKEN,
      });
      client = wrapUpstash(upstash);
      console.log("✅ Connected to Redis (Upstash REST)");
      return client;
    } catch (err) {
      console.error("❌ Failed to initialize Upstash Redis:", err.message);
    }
  }

  // ──────────────────────────────
  // 2️⃣ Fallback: node-redis TCP client
  // ──────────────────────────────
  try {
    const { createClient } = await import("redis");
    const raw = createClient({
      url: process.env.REDIS_URL || "redis://localhost:6379",
      socket: {
        reconnectStrategy: (retries) =>
          retries > 5 ? new Error("Max reconnect attempts reached") : 1000,
      },
    });

    raw.on("error", (err) => console.error("❌ Redis TCP Error:", err.message));
    await raw.connect();
    console.log("✅ Connected to Redis (TCP)");

    client = wrapTcp(raw);
    return client;
  } catch (err) {
    console.warn("⚠️ Redis TCP connection failed:", err.message);
  }

  // ──────────────────────────────
  // 3️⃣ Final fallback: dummy client (no Redis available)
  // ──────────────────────────────
  console.warn("⚠️ No Redis connection available — using fallback no-op client.");
  client = {
    get: async () => null,
    set: async () => null,
    del: async () => null,
    incr: async () => 0,
    expire: async () => null,
    keys: async () => [],
  };
  return client;
}

/* ──────────────────────────────
 * Export a promise for convenience
 * ────────────────────────────── */
export const redisPromise = getRedisClient();





