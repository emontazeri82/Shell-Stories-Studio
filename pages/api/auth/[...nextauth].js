// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { z } from 'zod';
import { verifyPassword } from '@/utils/password';
import { rateLimiter } from '@/lib/middleware/rateLimiter';
import { getUserByEmail } from '@/lib/db/users';   // <-- use the helper

const CredsSchema = z.object({
  email: z.string().email().max(256),
  password: z.string().min(1).max(512),
});

export const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,  // ✅ add this line
  session: { strategy: 'jwt' },
  pages: { signIn: '/admin/login' },
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: 'Email', type: 'text' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        const parsed = CredsSchema.safeParse({
          email: String(credentials?.email || '').trim(),
          password: String(credentials?.password || '').trim(),
        });
        if (!parsed.success) return null;

        const { email, password } = parsed.data;

        const user = await getUserByEmail(email); // <- from your DB
        if (!user?.password_hash) return null;

        const ok = await verifyPassword(password, user.password_hash);
        if (!ok) return null;

        const role = String(user.role || 'user').toUpperCase(); // 'user'|'admin' -> 'USER'|'ADMIN'
        return {
          id: String(user.id),
          email: user.email,
          name: user.name || 'User',
          role,
          image: null,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || 'USER'; // uppercase already
      }
      if (!token.role) token.role = 'USER';
      return token;
    },
    async session({ session, token }) {
      session.user = session.user || {};
      session.user.id = token.id || session.user.id;
      session.user.email = token.email || session.user.email;
      session.user.name = token.name || session.user.name || 'User';
      session.user.role = token.role || 'USER';
      session.user.image = null;
      return session;
    },
  },
  logger: {
    error(code, metadata) { console.error('❌ NextAuth error:', code, metadata); },
    warn(code) { console.warn('⚠️ NextAuth warning:', code); },
    debug(code, metadata) { /* console.debug('🐞', code, metadata); */ },
  },
};

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const ok = await new Promise(resolve =>
      rateLimiter(req, res, () => resolve(true), { limit: 10, window: 60 })
    );
    if (!ok || res.headersSent) return;
  }
  return NextAuth(req, res, authOptions);
}




