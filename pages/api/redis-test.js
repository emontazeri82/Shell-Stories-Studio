// /pages/api/redis-test.js
import { redisPromise } from '@/lib/redis';
import { safeRedisKey } from '@/lib/redis/formatkey'

export default async function handler(_req, res) {
  try {
    const redis = await redisPromise;
    const key = safeRedisKey ? safeRedisKey(['health', 'ping']) : 'health:ping';

    await redis.set(key, 'pong', { EX: 60 });   // set with 60s ttl
    const value = await redis.get(key);         // read it back

    res.status(200).json({ ok: true, key, value });
  } catch (e) {
    res.status(500).json({ ok: false, error: String(e) });
  }
}
