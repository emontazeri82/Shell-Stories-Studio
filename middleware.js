// middleware.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const url = req.nextUrl;

  // Apply rate limiting to login attempts
  /*if (url.pathname === '/api/auth/callback/credentials') {
    const limitResponse = await rateLimitEdge(req, { limit: 5, window: 60, prefix: 'login' });
    if (limitResponse) return limitResponse; // Block excessive requests
  }*/

  // Protect /admin routes (except login page)
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isProtectedPath = url.pathname.startsWith('/admin') && !url.pathname.startsWith('/admin/login');

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/api/auth/callback/credentials', '/admin/:path*'],
};


