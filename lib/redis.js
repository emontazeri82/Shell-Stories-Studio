// /lib/redis.js

let client = null;

/** Normalize options like { EX: 60 } -> { ex: 60 } */
function normalizeSetOpts(opts = {}) {
  if (!opts) return undefined;
  const ex = opts.ex ?? opts.EX ?? undefined;
  const px = opts.px ?? opts.PX ?? undefined;
  const out = {};
  if (ex != null) out.ex = ex;
  if (px != null) out.px = px;
  return Object.keys(out).length ? out : undefined;
}

// Wrap Upstash client to match a minimal common API
function wrapUpstash(upstash) {
  return {
    get: (k) => upstash.get(k),
    set: (k, v, opts) => upstash.set(k, v, normalizeSetOpts(opts)),
    del: (k) => upstash.del(k),
    incr: (k) => upstash.incr(k),
    expire: (k, s) => upstash.expire(k, s),
  };
}

// Wrap node-redis (TCP) to match the same API
function wrapTcp(nodeClient) {
  return {
    get: (k) => nodeClient.get(k),
    set: (k, v, opts) => nodeClient.set(k, v, normalizeSetOpts(opts)),
    del: (k) => nodeClient.del(k),
    incr: (k) => nodeClient.incr(k),
    expire: (k, s) => nodeClient.expire(k, s),
  };
}

export async function getRedisClient() {
  if (client) return client;

  // Prefer Upstash REST if present
  if (process.env.UPSTASH_REDIS_REST_URL && process.env.UPSTASH_REDIS_REST_TOKEN) {
    const { Redis } = await import('@upstash/redis');
    const upstash = new Redis({
      url: process.env.UPSTASH_REDIS_REST_URL,
      token: process.env.UPSTASH_REDIS_REST_TOKEN,
    });
    client = wrapUpstash(upstash);
    return client;
  }

  // Fallback to TCP Redis via node-redis (requires REDIS_URL)
  const { createClient } = await import('redis');

  const raw = createClient({
    url: process.env.REDIS_URL || 'redis://localhost:6379',
    socket: {
      reconnectStrategy: (retries) => (retries > 5 ? new Error('Max reconnect attempts reached') : 1000),
    },
  });

  raw.on('error', (err) => console.error('❌ Redis Error:', err));

  try {
    await raw.connect();
    console.log('✅ Connected to Redis (TCP)');
  } catch (err) {
    console.warn('⚠️ Redis connection failed:', err.message);
  }

  client = wrapTcp(raw);
  return client;
}

// Export a promise you can await where needed (no top-level await)
export const redisPromise = getRedisClient();




