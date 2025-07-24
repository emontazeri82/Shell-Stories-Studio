// lib/redis.js
import { createClient } from 'redis';

let client;

export async function getRedisClient() {
  if (!client) {
    client = createClient({
      url: process.env.REDIS_URL || 'redis://localhost:6379',
      socket: {
        reconnectStrategy: retries => {
          if (retries > 5) {
            console.error('❌ Redis: Max reconnect attempts reached.');
            return new Error('Max reconnect attempts reached');
          }
          return 1000; // retry after 1 second
        }
      }
    });

    client.on('error', (err) => {
      console.error('❌ Redis Error:', err);
    });

    try {
      await client.connect();
      console.log('✅ Connected to Redis');
    } catch (err) {
      console.warn('⚠️ Redis connection failed:', err.message);
    }
  }

  return client;
}


