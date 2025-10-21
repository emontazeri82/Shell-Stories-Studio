// lib/adminApiHandlers/handleGetPaginatedProducts.js
import { getRedisClient } from '@/lib/redis';
import { getPaginatedProducts } from '@/lib/productApiUtils';

const sortMap = {
  created_at_desc: 'created_at DESC',
  created_at_asc: 'created_at ASC',
  price_asc: 'price ASC',
  price_desc: 'price DESC',
  name_asc: 'name COLLATE NOCASE ASC',
  name_desc: 'name COLLATE NOCASE DESC',
  stock_desc: 'stock DESC',
};

/**
 * Safety helper: prevents Redis from hanging requests
 */
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Main handler for GET /api/admin/manage_products
 * Fetches products from Redis (if available) or DB.
 */
export async function handleGetPaginatedProducts(req, res) {
  const rid = req.rid || 'no-rid';
  const t0 = Date.now();

  const { page = 1, limit = 20, sort = 'created_at_desc', q = '' } = req.query || {};
  const sortSQL = sortMap[sort] || sortMap.created_at_desc;
  const useCache = process.env.USE_PRODUCTS_CACHE === '1';
  const cacheTTL = Number(process.env.PRODUCTS_CACHE_TTL || 60);
  const cacheTimeout = Number(process.env.CACHE_TIMEOUT_MS || 300);

  const cacheKey = `products:v1:page=${page}:limit=${limit}:sort=${sort}:q=${String(q || '').trim()}`;
  console.log(`\n[products] [${rid}] ▶ START handleGetPaginatedProducts`, { page, limit, sort, q });

  let redis = null;

  // ─────────────────────────────────────────────
  // 1️⃣ Attempt Redis connection (optional)
  // ─────────────────────────────────────────────
  if (useCache) {
    try {
      const tRedis = Date.now();
      redis = await getRedisClient();
      console.log(`[products] [${rid}] 🔌 Redis connected (${Date.now() - tRedis}ms)`);
    } catch (e) {
      console.warn(`[products] [${rid}] ⚠️ Redis unavailable: ${e?.message || e}`);
    }
  }

  // ─────────────────────────────────────────────
  // 2️⃣ Try cached data
  // ─────────────────────────────────────────────
  if (redis && useCache) {
    try {
      const t1 = Date.now();
      const cached = await withTimeout(redis.get(cacheKey), cacheTimeout, 'redis.get');
      const elapsed = Date.now() - t1;

      if (cached) {
        const payload = JSON.parse(cached);
        console.log(`[products] [${rid}] ✅ Redis HIT (${elapsed}ms, total=${payload.total}, rows=${payload.products.length})`);
        return res.status(200).json(payload);
      }

      console.log(`[products] [${rid}] 📦 Redis MISS (${elapsed}ms)`);
    } catch (e) {
      console.warn(`[products] [${rid}] ⚠️ Cache skipped: ${e?.message || e}`);
    }
  }

  // ─────────────────────────────────────────────
  // 3️⃣ Query database
  // ─────────────────────────────────────────────
  try {
    const tDB = Date.now();
    console.log(`[products] [${rid}] 🗄️ Running DB query...`);
    const result = await getPaginatedProducts(page, limit, sortSQL, q);
    const dbMs = Date.now() - tDB;

    if (!result || !Array.isArray(result.products)) {
      console.error(`[products] [${rid}] ❌ Invalid DB result structure`);
      return res.status(500).json({ ok: false, error: 'Database returned invalid data' });
    }

    const response = {
      ok: true,
      total: result.total,
      page: Number(result.page),
      pageSize: Number(limit),
      products: result.products,
      totalPages: result.totalPages,
    };

    console.log(
      `[products] [${rid}] ✅ DB OK (${dbMs}ms) total=${response.total} rows=${response.products.length}`
    );

    // ─────────────────────────────────────────────
    // 4️⃣ Cache write-through
    // ─────────────────────────────────────────────
    if (redis && useCache) {
      try {
        const tSet = Date.now();
        await withTimeout(
          redis.set(cacheKey, JSON.stringify(response), { EX: cacheTTL }),
          cacheTimeout,
          'redis.set'
        );
        console.log(`[products] [${rid}] 💾 Cached (${Date.now() - tSet}ms, key=${cacheKey})`);
      } catch (e) {
        console.warn(`[products] [${rid}] ⚠️ Failed to cache: ${e?.message || e}`);
      }
    }

    console.log(`[products] [${rid}] 🏁 DONE totalMs=${Date.now() - t0}`);
    return res.status(200).json(response);
  } catch (err) {
    console.error(`[products] [${rid}] ❌ DB Error:`, err);
    return res.status(500).json({ ok: false, error: 'Internal Server Error' });
  }
}



