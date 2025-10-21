import { getRedisClient } from '@/lib/redis';
import { getPaginatedProducts } from '@/lib/productApiUtils';

const sortMap = {
  created_at_desc: 'created_at DESC',
  created_at_asc : 'created_at ASC',
  price_asc      : 'price ASC',
  price_desc     : 'price DESC',
  name_asc       : 'name COLLATE NOCASE ASC',
  name_desc      : 'name COLLATE NOCASE DESC',
  stock_desc     : 'stock DESC',
};

// tiny helper to prevent blocking Redis
function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

export async function handleGetPaginatedProducts(req, res) {
  const rid = req.rid || '-';
  const t0 = Date.now();
  const { page = 1, limit = 20, sort = 'created_at_desc', q = '' } = req.query || {};
  const sortSQL = sortMap[sort] || sortMap.created_at_desc;

  console.log(`[products] [${rid}] START handleGetPaginatedProducts`, { page, limit, sort, q });

  const useCache = process.env.USE_PRODUCTS_CACHE === '1';
  const cacheTimeout = Number(process.env.CACHE_TIMEOUT_MS || 300);
  const cacheKey = `products:v1:page=${page}:limit=${limit}:sort=${sort}:q=${String(q || '').trim()}`;

  let redis = null;
  if (useCache) {
    try {
      const c0 = Date.now();
      redis = await getRedisClient();
      console.log(`[products] [${rid}] Redis connected in ${Date.now() - c0}ms`);
    } catch (e) {
      console.warn(`[products] [${rid}] ⚠️ Redis unavailable:`, e?.message || e);
    }
  }

  // 1️⃣ Try cache
  if (redis && useCache) {
    try {
      const c1 = Date.now();
      const cached = await withTimeout(redis.get(cacheKey), cacheTimeout, 'redis.get');
      const cMs = Date.now() - c1;
      console.log(`[products] [${rid}] redis.get ${cacheKey} took ${cMs}ms hit?`, !!cached);
      if (cached) {
        const payload = JSON.parse(cached);
        console.log(`[products] [${rid}] ✅ Redis HIT totalMs=${Date.now() - t0}`);
        return res.status(200).json(payload);
      }
      console.log(`[products] [${rid}] 📦 Redis MISS`);
    } catch (e) {
      console.warn(`[products] [${rid}] ⚠️ Cache skipped:`, e?.message || e);
    }
  } else if (useCache) {
    console.warn(`[products] [${rid}] ⚠️ Cache enabled but redis client missing`);
  }

  // 2️⃣ DB query
  try {
    console.log(`[products] [${rid}] running DB query...`);
    const dbStart = Date.now();
    const result = await getPaginatedProducts(page, limit, sortSQL, q);
    const dbMs = Date.now() - dbStart;
    console.log(`[products] [${rid}] DB returned ${result.products?.length || 0} rows in ${dbMs}ms`);

    // Normalize shape
    const response = {
      ok: true,
      total: result.total,
      page: Number(result.page),
      pageSize: Number(limit),
      products: result.products,
      totalPages: result.totalPages,
    };

    // 3️⃣ Cache write
    if (redis && useCache) {
      try {
        const s0 = Date.now();
        await withTimeout(
          redis.set(cacheKey, JSON.stringify(response), { EX: 60 }),
          cacheTimeout,
          'redis.set'
        );
        console.log(`[products] [${rid}] redis.set done in ${Date.now() - s0}ms`);
      } catch (e) {
        console.warn(`[products] [${rid}] ⚠️ Cache set skipped:`, e?.message || e);
      }
    }

    console.log(`[products] [${rid}] ✅ DONE total=${response.total} rows=${response.products.length} totalMs=${Date.now() - t0}`);
    return res.status(200).json(response);
  } catch (err) {
    console.error(`[products] [${rid}] ❌ Get Error:`, err);
    return res.status(500).json({ ok: false, error: 'Internal Error' });
  }
}

