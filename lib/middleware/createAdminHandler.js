// lib/middleware/createAdminHandler.js
import nc from 'next-connect';
import { authorizeAdmin } from '@/lib/auth/authorizeAdmin';
import { rateLimiter } from '@/lib/middleware/rateLimiter';

export function createAdminHandler(options = {}) {
  const {
    rateLimit = { limit: 60, window: 60 },
    onError = (err, req, res) => {
      console.error('❌ Admin API Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    },
    onNoMatch = (req, res) => {
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    },
  } = options;

  const handler = nc({ onError, onNoMatch });

  handler.use((req, res, next) => rateLimiter(req, res, next, rateLimit));
  handler.use(authorizeAdmin);

  return handler;
}
