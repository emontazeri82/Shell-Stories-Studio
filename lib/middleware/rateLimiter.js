// lib/middleware/rateLimiter.js

import { getRedisClient } from '@/lib/redis';

export async function rateLimiter(req, res, next, options = {}) {
    try {
      const redis = await getRedisClient();
  
      const ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress || 'unknown';
      const key = `rate-limit:${ip}`;
      
      const limit = options.limit || 60;
      const windowSeconds = options.window || 60;
  
      const count = await redis.incr(key);
  
      if (count === 1) await redis.expire(key, windowSeconds);
      if (count > limit) {
        return res.status(429).json({ error: 'Too many requests. Please try again later.' });
      }
  
      res.setHeader('X-RateLimit-Limit', limit);
      res.setHeader('X-RateLimit-Remaining', Math.max(0, limit - count));
      res.setHeader('X-RateLimit-Reset', windowSeconds);
  
      return next();
    } catch (err) {
      console.error('⚠️ Rate limiter failed, allowing request to proceed:', err);
      return next(); // ✅ Allow request even if Redis fails
    }
  }
  