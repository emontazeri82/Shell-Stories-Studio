import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

/** @param {import('next/server').NextRequest} req */
export async function middleware(req) {
  const url = req.nextUrl;                 // ✅ define first
  const pathname = url.pathname;           // ✅ define first

  console.log('[middleware] checking token for path:', pathname);

  // Skip system/static paths
  if (
    pathname.startsWith('/.well-known') ||
    pathname.startsWith('/_next') ||
    pathname.startsWith('/favicon.ico')
  ) {
    return NextResponse.next();
  }

  if (req.method === 'OPTIONS') {
    const res = new NextResponse(null, { status: 204 });
    res.headers.set('Allow', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    return res;
  }
  console.time('[MW] ${pathname}');
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  console.log('[middleware] token found:', !!token, 'role:', token?.role);
  console.log('[MW]', pathname, 'rid?', req.headers.get('x-request-id') || '-', 'token?', !!token, 'role:', token?.role);
  console.timeEnd(`[MW] ${pathname}`);
  
  const isAdminApi = pathname.startsWith('/api/admin/');
  const isAdminPage = pathname.startsWith('/admin') && pathname !== '/admin/login';

  const requireRole = process.env.REQUIRE_ADMIN_ROLE === '1';
  const rawRole =
    token?.role ??
    token?.user?.role ??
    token?.claims?.role ??
    '';

  const normalizedRole = String(rawRole).toUpperCase();
  const hasAdminRole = normalizedRole === 'ADMIN';


  const accept = req.headers.get('accept') || '';
  const isXHR = req.headers.get('x-requested-with') === 'XMLHttpRequest';
  const expectsJSON = isAdminApi || isXHR || accept.includes('application/json');

  const authed = !!token && (!requireRole || hasAdminRole);

  if (!authed) {
    if (expectsJSON) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    if (isAdminPage) {
      const loginUrl = url.clone();
      loginUrl.pathname = '/admin/login';
      loginUrl.search = '';
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/admin/:path*', '/admin/:path*'],
};






