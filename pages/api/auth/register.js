// pages/api/auth/register.js
/*import { openDB } from '@/lib/db';
import argon2 from 'argon2';
import { getServerSession } from 'next-auth/next';
import { authOptions } from './[...nextauth]'; // adjust if necessary

export default async function handler(req, res) {
  // 1. ✅ Allow only POST
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  // 2. 🔐 Authenticate admin using session
  const session = await getServerSession(req, res, authOptions);
  if (!session || session.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied' });
  }

  const { email, name, password, role = 'user' } = req.body;

  // 3. 🧼 Basic validation
  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email and password are required' });
  }

  try {
    const db = await openDB();

    // 4. ❌ Prevent duplicate registration
    const existing = await db.get(`SELECT * FROM users WHERE email = ?`, email);
    if (existing) {
      return res.status(409).json({ error: 'User already exists' });
    }
     // 🚫 Optional: Prevent registering more than one admin
     if (role === 'admin' && email !== process.env.ADMIN_EMAIL) {
        return res.status(403).json({ error: 'Only the root admin can create another admin' });
      }

    // 5. ✅ Securely hash the password
    const hashedPassword = await argon2.hash(password);

    // 6. ✅ Create user with assigned role (default is "user")
    await db.run(
      `INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)`,
      [email, name || '', hashedPassword, role]
    );

    return res.status(201).json({ message: 'User registered successfully' });
  } catch (err) {
    console.error('❌ Registration error:', err);
    return res.status(500).json({ error: 'Internal Server Error' });
  }
}*/
export default function handler(req, res) {
    return res.status(403).json({ error: 'User registration is disabled' });
  }
  

