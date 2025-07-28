// lib/middleware/createAdminUploadHandler.js
import nc from 'next-connect';
import { authorizeAdmin } from '@/lib/auth/authorizeAdmin';
import { rateLimiter } from '@/lib/middleware/rateLimiter';

export function createAdminUploadHandler({ uploadMiddleware, ...options } = {}) {
    const handler = nc({
      onError: (err, req, res) => {
        console.error('Upload Error:', err);
        res.status(500).json({ error: 'Internal Server Error' });
      },
      onNoMatch: (req, res) => {
        res.status(405).json({ error: `Method ${req.method} not allowed` });
      },
      ...options,
    });
  
    if (uploadMiddleware) handler.use(uploadMiddleware); // ✅ This comes first
    handler.use(rateLimiter);
    handler.use(authorizeAdmin);
  
    return handler;
  }
  