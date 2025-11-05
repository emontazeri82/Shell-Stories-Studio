// lib/adminApiHandlers/handleGetPaginatedProducts.js
import { getRedisClient } from "@/lib/redis";
import { getPaginatedProducts } from "@/lib/productApiUtils";
import { safeRedisKey } from "@/lib/redis/formatkey";

/**
 * Mapping of frontend sort keys → SQL ORDER BY clauses
 */
const sortMap = {
  created_at_desc: "created_at DESC",
  created_at_asc: "created_at ASC",
  price_asc: "price ASC",
  price_desc: "price DESC",
  name_asc: "name COLLATE NOCASE ASC",
  name_desc: "name COLLATE NOCASE DESC",
  stock_desc: "stock DESC",
};

/**
 * Timeout wrapper to prevent Redis hangups
 */
async function withTimeout(promise, ms, label) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error(`${label} timeout after ${ms}ms`)), ms)
    ),
  ]);
}

/**
 * Main Admin Handler: GET /api/admin/manage_products
 * ✅ Supports pagination, sorting, search, and Redis caching
 */
export async function handleGetPaginatedProducts(req, res) {
  const rid = req.rid || Math.random().toString(36).slice(2, 8);
  const t0 = performance.now();

  const {
    page = 1,
    limit = 20,
    sort = "created_at_desc",
    q = "",
  } = req.query || {};

  const sortSQL = sortMap[sort] || sortMap.created_at_desc;
  const useCache = process.env.USE_PRODUCTS_CACHE === "1";
  const cacheTTL = Number(process.env.PRODUCTS_CACHE_TTL || 60);
  const cacheTimeout = Number(process.env.CACHE_TIMEOUT_MS || 300);

  const cacheKey = safeRedisKey([
    "products:v1",
    `page=${page}`,
    `limit=${limit}`,
    `sort=${sort}`,
    `q=${String(q || "").trim()}`,
  ]);

  console.log(
    `\n[Handler][Products][${rid}] ▶ START handleGetPaginatedProducts`,
    { page, limit, sort, q }
  );

  let redis = null;

  // ─────────────────────────────────────────────
  // 1️⃣ Attempt Redis Connection
  // ─────────────────────────────────────────────
  if (useCache) {
    try {
      const tRedis = performance.now();
      redis = await getRedisClient();
      console.log(
        `[Handler][Products][${rid}] 🔌 Redis connected (${(
          performance.now() - tRedis
        ).toFixed(0)}ms)`
      );
    } catch (e) {
      console.warn(
        `[Handler][Products][${rid}] ⚠️ Redis unavailable:`,
        e?.message || e
      );
    }
  }

  // ─────────────────────────────────────────────
  // 2️⃣ Try Cached Data (if Redis enabled)
  // ─────────────────────────────────────────────
  if (redis && useCache) {
    try {
      const t1 = performance.now();
      const cached = await withTimeout(
        redis.get(cacheKey),
        cacheTimeout,
        "redis.get"
      );
      const elapsed = (performance.now() - t1).toFixed(0);

      if (cached) {
        const payload = JSON.parse(cached);
        console.log(
          `[Handler][Products][${rid}] ✅ Redis HIT (${elapsed}ms, total=${payload.total}, rows=${payload.products.length})`
        );
        return res.status(200).json(payload);
      }

      console.log(`[Handler][Products][${rid}] 📦 Redis MISS (${elapsed}ms)`);
    } catch (e) {
      console.warn(
        `[Handler][Products][${rid}] ⚠️ Cache skipped:`,
        e?.message || e
      );
    }
  }

  // ─────────────────────────────────────────────
  // 3️⃣ Query Database (fallback)
  // ─────────────────────────────────────────────
  try {
    const tDB = performance.now();
    console.log(`[Handler][Products][${rid}] 🗄️ Querying database...`);

    const result = await getPaginatedProducts(page, limit, sortSQL, q);
    const dbMs = (performance.now() - tDB).toFixed(0);

    if (!result || !Array.isArray(result.products)) {
      console.error(
        `[Handler][Products][${rid}] ❌ Invalid DB result structure`,
        result
      );
      return res
        .status(500)
        .json({ ok: false, error: "Database returned invalid structure" });
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
      `[Handler][Products][${rid}] ✅ DB OK (${dbMs}ms) total=${response.total} rows=${response.products.length}`
    );

    // ─────────────────────────────────────────────
    // 4️⃣ Write Through Cache (if Redis enabled)
    // ─────────────────────────────────────────────
    if (redis && useCache) {
      try {
        const tSet = performance.now();
        await withTimeout(
          redis.set(cacheKey, JSON.stringify(response), { EX: cacheTTL }),
          cacheTimeout,
          "redis.set"
        );
        console.log(
          `[Handler][Products][${rid}] 💾 Cached (${(
            performance.now() - tSet
          ).toFixed(0)}ms) → key=${cacheKey}`
        );
      } catch (e) {
        console.warn(
          `[Handler][Products][${rid}] ⚠️ Failed to cache:`,
          e?.message || e
        );
      }
    }

    console.log(
      `[Handler][Products][${rid}] 🏁 DONE in ${(
        performance.now() - t0
      ).toFixed(0)}ms`
    );
    return res.status(200).json(response);
  } catch (err) {
    console.error(`[Handler][Products][${rid}] ❌ DB Error:`, err);
    return res.status(500).json({ ok: false, error: "Internal Server Error" });
  }
}




