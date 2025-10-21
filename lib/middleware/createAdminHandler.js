// lib/middleware/createAdminHandler.js
import nc from 'next-connect';
import { authorizeAdmin } from '@/lib/auth/authorizeAdmin';
import { rateLimiter } from '@/lib/middleware/rateLimiter';
import { withRequestId } from './requestId';

// ─────────────────────────────────────────────
// Small helpers
// ─────────────────────────────────────────────
const isObj = v => v && typeof v === 'object';
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : d;
};

// Wrap rate limiter safely
function wrapRateLimiter(rateLimiterFn, opts) {
  return async (req, res, next) => {
    try {
      let passed = false;
      await new Promise(resolve => {
        rateLimiterFn(req, res, () => {
          passed = true;
          resolve();
        }, opts);
      });
      if (res.headersSent) return;
      if (passed) return next();
      next(); // fallback if uncertain
    } catch (e) {
      console.error('[rateLimiter] 💥 Error:', e);
      if (!res.headersSent) res.status(429).json({ error: 'Rate limit error' });
    }
  };
}

// ─────────────────────────────────────────────
// Main factory function
// ─────────────────────────────────────────────
export function createAdminHandler(options = {}) {
  const rawRL = isObj(options.rateLimit) ? options.rateLimit : {};
  const rateLimit = {
    limit: toInt(rawRL.limit, 60),
    window: toInt(rawRL.window, 60),
  };

  // ──────────────────────────────
  // Error Handlers
  // ──────────────────────────────
  const onError =
    options.onError ||
    ((err, req, res) => {
      const status = Number(err?.statusCode ?? err?.status ?? 500) || 500;
      const message =
        (typeof err?.message === 'string' && err.message) ||
        'Internal Server Error';

      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
      }

      console.error(`❌ [Admin API Error] (${req.method} ${req.url}):`, message);
      res.status(status).json({ error: message });
    });

  const onNoMatch =
    options.onNoMatch ||
    ((req, res) => {
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    });

  // ──────────────────────────────
  // Create handler
  // ──────────────────────────────
  const handler = nc({ onError, onNoMatch });

  // Add unique Request ID (for tracing)
  handler.use(withRequestId);

  // ──────────────────────────────
  // Dev request logger
  // ──────────────────────────────
  if (process.env.NODE_ENV !== 'production') {
    handler.use((req, _res, next) => {
      if (!req.url?.startsWith('/_next')) {
        console.log(`\n[admin] [${req.rid}] ${req.method} ${req.url}`);
      }
      next();
    });
  }

  // ──────────────────────────────
  // OPTIONS preflight handler
  // ──────────────────────────────
  handler.use((req, res, next) => {
    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      return res.status(204).end();
    }
    next();
  });

  // ──────────────────────────────
  // Default security headers
  // ──────────────────────────────
  handler.use((req, res, next) => {
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'X-Requested-With');
    next();
  });

  // ──────────────────────────────
  // Apply Rate Limiting
  // (Skip for GET requests)
  // ──────────────────────────────
  handler.use((req, res, next) => {
    if (req.method === 'GET') {
      console.log(`[admin] [${req.rid}] ⏩ Skip rateLimiter for GET`);
      return next();
    }
    console.log(`[admin] [${req.rid}] 🧭 Applying rateLimiter for ${req.method}`);
    return wrapRateLimiter(rateLimiter, rateLimit)(req, res, next);
  });

  // ──────────────────────────────
  // Authorization Guard
  // ──────────────────────────────
  handler.use(async (req, res, next) => {
    console.log(`[admin] [${req.rid}] 🔐 Checking authorization...`);
    try {
      await authorizeAdmin()(req, res, next);
    } catch (err) {
      const status = Number(err?.status ?? 401) || 401;
      if (!res.headersSent) {
        console.error(`[admin] [${req.rid}] 🚫 Authorization failed:`, err?.message || err);
        return res.status(status).json({ error: err?.message || 'Unauthorized' });
      }
    }
  });

  // ──────────────────────────────
  // Done
  // ──────────────────────────────
  return handler;
}




