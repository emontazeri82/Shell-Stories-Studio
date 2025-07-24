import { getRedisClient } from '@/lib/redis';
import { getPaginatedProducts } from '@/lib/productApiUtils';

const sortMap = {
  'created_at_desc': 'created_at DESC',
  'created_at_asc': 'created_at ASC',
  'price_asc': 'price ASC',
  'price_desc': 'price DESC',
  'name_asc': 'name COLLATE NOCASE ASC',
  'name_desc': 'name COLLATE NOCASE DESC',
  'stock_desc': 'stock DESC'
};

export async function handleGetPaginatedProducts(req, res) {
  const { page = 1, limit = 20, sort = 'created_at_desc' } = req.query;
  const sortSQL = sortMap[sort] || 'created_at DESC';
  const cacheKey = `products:page=${page}:limit=${limit}:sort=${sort}`;
  let redis;

  try {
    redis = await getRedisClient();
    const cached = await redis.get(cacheKey);
    if (cached) {
      console.log(`📦 Redis hit for key: ${cacheKey}`);
      return res.status(200).json(JSON.parse(cached));
    }
    console.log(`📦 Redis MISS for key: ${cacheKey}`);
  } catch {
    console.warn('⚠️ Redis unavailable');
  }

  try {
    const result = await getPaginatedProducts(page, limit, sortSQL);

    const response = {
      products: result.products,
      total: result.total,
      page: result.page,
      totalPages: result.totalPages,
    };

    if (redis) await redis.set(cacheKey, JSON.stringify(response), { EX: 60 });

    return res.status(200).json(response);
  } catch (err) {
    console.error('❌ Get Error:', err);
    return res.status(500).json({ error: 'Internal Error' });
  }
}
