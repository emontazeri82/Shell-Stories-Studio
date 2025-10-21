// lib/auth/authorizeAdmin.js
import { getToken } from 'next-auth/jwt';

export const ROLES = { ADMIN: 'ADMIN', USER: 'USER' };

// ─────────────────────────────────────────────
// Helper utilities
// ─────────────────────────────────────────────
function wantsJson(req) {
  const url = req.url || '';
  const accept = String(req.headers?.accept || '').toLowerCase();
  const xrw = String(req.headers?.['x-requested-with'] || '').toLowerCase();
  return url.startsWith('/api/') || accept.includes('application/json') || xrw === 'xmlhttprequest';
}

function safeCallbackUrl(req) {
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    return u.pathname + u.search; // same-origin path only
  } catch {
    return '/';
  }
}

// ─────────────────────────────────────────────
// Core middleware
// ─────────────────────────────────────────────
export function authorizeAdmin(loginPath = '/admin/login') {
  console.log('[authorizeAdmin] middleware initialized');

  return async function guard(req, res, next) {
    const rid = req.rid || '-';
    const t0 = Date.now();

    console.log('[authorizeAdmin]', rid, 'ENTER for', req.method, req.url);

    try {
      console.log('[authorizeAdmin]', 'EXECUTION ENTERED for', req.method, req.url);

      // 🔑 Try reading the session token
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      console.log('[authorizeAdmin]', rid, 'token check →', token ? 'FOUND' : 'MISSING', 'role:', token?.role);

      if (!token) {
        console.warn('[authorizeAdmin]', rid, 'NO TOKEN (unauthenticated)');
        if (wantsJson(req)) {
          console.log('[authorizeAdmin]', rid, '→ returning 401 JSON');
          return res.status(401).json({
            ok: false,
            code: 'UNAUTHENTICATED',
            error: 'Unauthorized',
          });
        }
        const cb = encodeURIComponent(safeCallbackUrl(req));
        console.log('[authorizeAdmin]', rid, '→ redirecting to login');
        return res.redirect(`${loginPath}?callbackUrl=${cb}`);
      }

      // Normalize role (e.g. "admin" → "ADMIN")
      const role = String(token.role || 'USER').toUpperCase();
      console.log('[authorizeAdmin]', rid, 'normalized role:', role);

      if (role !== ROLES.ADMIN) {
        console.warn('[authorizeAdmin]', rid, 'role not admin → forbidden');
        if (wantsJson(req)) {
          console.log('[authorizeAdmin]', rid, '→ returning 403 JSON');
          return res.status(403).json({
            ok: false,
            code: 'FORBIDDEN',
            error: 'Forbidden',
          });
        }
        return res.redirect('/403');
      }

      // ✅ Authorized
      req.user = {
        id: token.sub || null,
        email: token.email || null,
        role,
      };

      console.log(
        '[authorizeAdmin]',
        rid,
        'AUTHORIZED → calling next() | user:',
        JSON.stringify(req.user),
        'in',
        Date.now() - t0,
        'ms'
      );

      return next(); // <--- this ensures the middleware chain continues
    } catch (err) {
      console.error('[authorizeAdmin]', rid, 'ERROR →', err?.message || err);
      if (wantsJson(req)) {
        console.log('[authorizeAdmin]', rid, '→ returning 401 JSON (token error)');
        return res.status(401).json({
          ok: false,
          code: 'TOKEN_ERROR',
          error: 'Unauthorized',
        });
      }
      console.log('[authorizeAdmin]', rid, '→ redirecting to login (exception)');
      return res.redirect(loginPath);
    }
  };
}

// ─────────────────────────────────────────────
// Wrapper for standalone Next.js API routes
// ─────────────────────────────────────────────
export function withAdmin(handler, loginPath = '/admin/login') {
  const mw = authorizeAdmin(loginPath);
  return async (req, res) => {
    const rid = req.rid || '-';
    console.log('[withAdmin]', rid, 'ENTER → wrapping handler for', req.url);
    await mw(req, res, async () => {
      console.log('[withAdmin]', rid, 'AUTH OK → executing handler');
      await handler(req, res);
      console.log('[withAdmin]', rid, 'HANDLER COMPLETE');
    });
  };
}





