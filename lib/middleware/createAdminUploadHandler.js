// lib/middleware/createAdminUploadHandler.js
import nc from 'next-connect';
import { authorizeAdmin } from '@/lib/auth/authorizeAdmin';
import { rateLimiter } from '@/lib/middleware/rateLimiter';

export function createAdminUploadHandler({ uploadMiddleware, ...options } = {}) {
  const {
    rateLimit = { limit: 30, window: 60 }, // stricter for uploads
    onError = (err, req, res) => {
      console.error('Upload Error:', err);
      res.status(500).json({ error: 'Internal Server Error' });
    },
    onNoMatch = (req, res) => {
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    },
  } = options;

  const handler = nc({ onError, onNoMatch });

  // ✅ Order matters: cheap checks first, heavy parsing last
  handler.use((req, res, next) => rateLimiter(req, res, next, rateLimit));
  handler.use(authorizeAdmin);

  // Multer (streams/allocations) only after we know the request is allowed
  if (uploadMiddleware) handler.use(uploadMiddleware);

  return handler;
}
