// pages/api/auth/[...nextauth].js
import NextAuth from 'next-auth';
import CredentialsProvider from 'next-auth/providers/credentials';
import { verifyPassword } from '@/utils/password';
import { rateLimiter } from '@/lib/middleware/rateLimiter';

const adminEmail = process.env.ADMIN_EMAIL;
const hashedPassword = process.env.HASHED_ADMIN_PASSWORD; // ✅ Use from .env only

export const authOptions = {
  providers: [
    CredentialsProvider({
      name: 'Admin Login',
      credentials: {
        email: { label: "Email", type: "text" },
        password: { label: "Password", type: "password" }
      },
      async authorize(credentials) {
        const inputEmail = String(credentials?.email || '').trim();
        const inputPassword = String(credentials?.password || '').trim();

        //console.log("🔍 Received credentials:", credentials);
        //console.log("✅ Input email:", inputEmail);
        //console.log("✅ Expected email:", adminEmail);
        //console.log("📌 Email match:", inputEmail === adminEmail);

        if (!inputEmail || !inputPassword) {
          console.log("❌ Missing credentials");
          return null;
        }

        if (inputEmail !== adminEmail) {
          console.log("❌ Email does not match");
          return null;
        }

        try {
          //console.log("✅ Loaded HASHED_ADMIN_PASSWORD:", JSON.stringify(hashedPassword));

          if (!hashedPassword || !hashedPassword.startsWith('$argon2id$')) {
            console.error("❌ Invalid HASHED_ADMIN_PASSWORD format in .env");
            return null;
          }

          const passwordMatches = await verifyPassword(inputPassword, hashedPassword);
          //console.log("🧪 Password match:", passwordMatches);

          if (passwordMatches) {
            console.log("🎉 Success! Logging in.");
            return {
              id: 1,
              name: 'Admin',
              email: inputEmail,
              role: 'admin',
              image: null, // 👈 Required to avoid serialization issues in Next.js
            };
          }
        } catch (err) {
          console.error("❌ Error verifying password:", err);
        }

        console.log("❌ Invalid credentials.");
        return null;
      }
    })
  ],
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/admin/login',
  },
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.email = user.email;
        token.name = user.name;
        token.role = user.role || 'admin';
      }
      return token;
    },
    async session({ session, token }) {
      // ✅ Always check that session.user exists before assigning
      if (!session.user) {
        session.user = {};
      }

      session.user.id = token.id;
      session.user.email = token.email;
      session.user.name = token.name;
      session.user.role = token.role || 'admin';
      session.user.image = null;

      return session;
    },
  },
  // Optional logger for debugging auth issues
  logger: {
    error(code, metadata) {
      console.error("❌ NextAuth error:", code, metadata);
    },
    warn(code) {
      console.warn("⚠️ NextAuth warning:", code);
    },
    debug(code, metadata) {
      console.debug("🐞 NextAuth debug:", code, metadata);
    },
  },
};

export default async function handler(req, res) {
  // ✅ Apply rateLimiter ONLY to POST (login attempts)
  if (req.method === 'POST') {
    await rateLimiter(req, res, () => {}, { limit: 10, window: 60 });
  }

  return await NextAuth(req, res, authOptions);
}




