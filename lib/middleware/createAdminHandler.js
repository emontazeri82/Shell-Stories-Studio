// lib/middleware/createAdminHandler.js
import nc from 'next-connect';
import { authorizeAdmin } from '@/lib/auth/authorizeAdmin';
import { rateLimiter } from '@/lib/middleware/rateLimiter';
import { withRequestId } from './requestId';

// ─────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────
const isObj = (v) => v && typeof v === 'object';
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : d;
};

// Wrap rate limiter into safe Express middleware form
function wrapRateLimiter(rateLimiterFn, rateLimitOpts) {
  return async (req, res, next) => {
    const rid = req.rid || '-';
    const t0 = Date.now();
    console.log('[admin]', rid, 'mw:rateLimiter ENTER', { limit: rateLimitOpts?.limit, window: rateLimitOpts?.window });

    try {
      let passed = false;
      await new Promise((resolve) => {
        // signature: (req, res, next, options)
        rateLimiterFn(req, res, () => {
          passed = true;
          resolve(true);
        }, rateLimitOpts);
      });

      if (res.headersSent) {
        console.log('[admin]', rid, 'mw:rateLimiter RESPONDED (e.g., 429) in', Date.now() - t0, 'ms');
        return; // short-circuited by limiter
      }

      if (passed) {
        console.log('[admin]', rid, 'mw:rateLimiter PASS in', Date.now() - t0, 'ms');
        return next();
      }

      // Defensive: continue even if no signal
      console.warn('[admin]', rid, 'mw:rateLimiter NO-SIGNAL → allowing through in', Date.now() - t0, 'ms');
      return next();
    } catch (e) {
      console.error('[admin]', rid, 'mw:rateLimiter ERROR', e?.message || e);
      if (!res.headersSent) res.status(429).json({ error: 'Rate limit error' });
    }
  };
}

// ─────────────────────────────────────────────
// Main factory function
// ─────────────────────────────────────────────
export function createAdminHandler(options = {}) {
  // Normalize options
  const rawRL = isObj(options.rateLimit) ? options.rateLimit : {};
  const rateLimit = {
    limit: toInt(rawRL.limit, 60),
    window: toInt(rawRL.window, 60),
  };

  // Global error handler
  const onError =
    options.onError ||
    ((err, req, res) => {
      const rid = req?.rid || '-';
      const status = Number(err?.statusCode ?? err?.status ?? 500) || 500;
      const message =
        (typeof err?.message === 'string' && err.message) ||
        'Internal Server Error';

      if (!res.headersSent) {
        res.setHeader('Content-Type', 'application/json; charset=utf-8');
        res.setHeader('Cache-Control', 'no-store');
      }

      console.error('❌ Admin API Error [rid=' + rid + ']:', message, '| detail:', err);
      res.status(status).json({ error: message });
    });

  // “No match” handler
  const onNoMatch =
    options.onNoMatch ||
    ((req, res) => {
      const rid = req?.rid || '-';
      console.warn('[admin]', rid, 'onNoMatch', req.method, req.url);
      res.status(405).json({ error: `Method ${req.method} not allowed` });
    });

  // Create next-connect handler
  const handler = nc({ onError, onNoMatch });

  // Add unique Request ID (FIRST)
  handler.use((req, res, next) => {
    const t0 = Date.now();
    withRequestId(req, res, () => {
      req._adminStart = t0;
      console.log('[admin]', req.rid, 'mw:requestId SET');
      next();
    });
  });

  // Dev logger
  if (process.env.NODE_ENV !== 'production') {
    handler.use((req, _res, next) => {
      const method = String(req.method || '').toUpperCase();
      if (!req.url?.startsWith('/_next')) {
        console.log(`[admin] ${method} ${req.url} [rid=${req.rid}] ENTER`);
      }
      next();
    });
  }

  // Preflight (OPTIONS)
  handler.use((req, res, next) => {
    const rid = req.rid || '-';
    if (req.method === 'OPTIONS') {
      res.setHeader('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
      console.log('[admin]', rid, 'mw:preflight 204');
      return res.status(204).end();
    }
    console.log('[admin]', rid, 'mw:preflight SKIP');
    next();
  });

  // Default JSON headers
  handler.use((req, res, next) => {
    const rid = req.rid || '-';
    if (!res.getHeader('Content-Type')) {
      res.setHeader('Content-Type', 'application/json; charset=utf-8');
    }
    res.setHeader('Cache-Control', 'no-store');
    res.setHeader('Vary', 'X-Requested-With');
    console.log('[admin]', rid, 'mw:headers SET');
    next();
  });

  // Rate limiting (skip safe methods; normalize method casing defensively)
  handler.use((req, res, next) => {
    const rid = req.rid || '-';
    const method = String(req.method || '').toUpperCase();

    if (method === 'GET' || method === 'HEAD' || method === 'OPTIONS') {
      console.log('[admin]', rid, 'mw:rateLimiter SKIP for', method);
      return next();
    }

    console.log('[admin]', rid, 'mw:rateLimiter APPLY for', method);
    return wrapRateLimiter(rateLimiter, rateLimit)(req, res, next);
  });

  // Authorization guard
  handler.use(async (req, res, next) => {
    const rid = req.rid || '-';
    const t0 = Date.now();
    console.log('[admin]', rid, 'mw:authorize START');

    try {
      await authorizeAdmin()(req, res, async () => {
        console.log('[admin]', rid, 'mw:authorize OK in', Date.now() - t0, 'ms');
        next();
      });
    } catch (err) {
      console.log('[admin]', rid, 'mw:authorize ERROR in', Date.now() - t0, 'ms', err?.message || err);
      const status = Number(err?.status ?? 401) || 401;
      if (!res.headersSent) {
        return res.status(status).json({ error: err?.message || 'Unauthorized' });
      }
    }
  });

  // Final lifecycle footer (only runs if a route handler calls res.end/json)
  handler.use((req, _res, next) => {
    const rid = req.rid || '-';
    const started = req._adminStart || Date.now();
    console.log('[admin]', rid, 'mw:chain CONTINUE (route next) chainMs=', Date.now() - started);
    next();
  });

  return handler;
}



