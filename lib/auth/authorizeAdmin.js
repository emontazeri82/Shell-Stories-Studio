// lib/auth/authorizeAdmin.js
import { getToken } from 'next-auth/jwt';

export const ROLES = { ADMIN: 'ADMIN', USER: 'USER' };

/**
 * Utility — detects if request expects JSON response
 */
function wantsJson(req) {
  const url = req.url || '';
  const accept = (req.headers?.accept || '').toLowerCase();
  const xrw = (req.headers?.['x-requested-with'] || '').toLowerCase();
  return url.startsWith('/api/') || accept.includes('application/json') || xrw === 'xmlhttprequest';
}

/**
 * Utility — builds safe redirect URL
 */
function safeCallbackUrl(req) {
  try {
    const u = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
    return u.pathname + u.search;
  } catch {
    return '/';
  }
}

/**
 * Express/Next-Connect style middleware for admin authorization.
 * Logs key events and safely handles redirects and JSON responses.
 */
export function authorizeAdmin(loginPath = '/admin/login') {
  return async function guard(req, res, next) {
    const rid = req.rid || Math.random().toString(36).slice(2, 8);
    const path = req.url || '';

    console.log(`\n[authorizeAdmin] [${rid}] ▶ START for ${req.method} ${path}`);

    try {
      // Try reading JWT token
      const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
      if (!token) {
        console.warn(`[authorizeAdmin] [${rid}] ⚠️ No token found`);
        if (wantsJson(req)) return res.status(401).json({ ok: false, code: 'UNAUTHENTICATED', error: 'Unauthorized' });
        const cb = encodeURIComponent(safeCallbackUrl(req));
        return res.redirect(`${loginPath}?callbackUrl=${cb}`);
      }

      // Normalize role
      const role = String(token.role || 'USER').toUpperCase();
      console.log(`[authorizeAdmin] [${rid}] ✅ Token found, role=${role}`);

      // Require ADMIN role
      if (role !== ROLES.ADMIN) {
        console.warn(`[authorizeAdmin] [${rid}] ⛔ Forbidden: role=${role}`);
        if (wantsJson(req)) return res.status(403).json({ ok: false, code: 'FORBIDDEN', error: 'Forbidden' });
        return res.redirect('/403');
      }

      // Attach user info to req
      req.user = { id: token.sub, email: token.email, role };

      console.log(`[authorizeAdmin] [${rid}] ✅ Authorized ADMIN user: ${token.email}`);
      return next();
    } catch (err) {
      console.error(`[authorizeAdmin] [${rid}] ❌ Token error:`, err);
      if (wantsJson(req)) return res.status(401).json({ ok: false, code: 'TOKEN_ERROR', error: 'Unauthorized' });
      return res.redirect(loginPath);
    }
  };
}

/**
 * Wrapper for vanilla Next.js API routes.
 * Example:
 *   export default withAdmin((req, res) => { res.json({ ok: true }) })
 */
export function withAdmin(handler, loginPath = '/admin/login') {
  const mw = authorizeAdmin(loginPath);
  return async (req, res) => mw(req, res, async () => handler(req, res));
}






