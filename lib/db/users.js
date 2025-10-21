// /lib/db/users.js
import { getDb } from './sqlite.js';

/**
 * Returns: { id, email, name, password_hash, role, created_at } | undefined
 */
export async function getUserByEmail(email) {
  const db = await getDb();
  return db.get(
    `SELECT id, email, name, password_hash, role, created_at
       FROM users
      WHERE email = ?
      LIMIT 1`,
    email
  );
}

/** (Optional) Create a user – useful if you ever add a UI for new admins. */
export async function createUser({ email, name, password_hash, role = 'user' }) {
  const db = await getDb();
  const result = await db.run(
    `INSERT INTO users (email, name, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    email, name ?? null, password_hash, role
  );
  return { id: result.lastID };
}

/** (Optional) Promote a user to admin */
export async function setUserRole(email, role) {
  const db = await getDb();
  await db.run(`UPDATE users SET role = ? WHERE email = ?`, role, email);
}
