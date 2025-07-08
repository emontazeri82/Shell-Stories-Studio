// middleware.js
import { getToken } from 'next-auth/jwt';
import { NextResponse } from 'next/server';

export async function middleware(req) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  const isProtectedPath = req.nextUrl.pathname.startsWith('/admin') &&
                        !req.nextUrl.pathname.startsWith('/admin/login');


  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/admin/login', req.url));
  }

  return NextResponse.next();
}

