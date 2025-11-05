// /lib/db/users.js
import { getDb } from "./sqlite.js";

/**
 * Fetch a user by email.
 * Returns: { id, email, name, password_hash, role, created_at } | undefined
 */
export async function getUserByEmail(email) {
  try {
    const db = await getDb();
    const user = await db.get(
      `SELECT id, email, name, password_hash, role, created_at
         FROM users
        WHERE email = ?
        LIMIT 1`,
      email
    );

    console.log(`[DB][Users] ✅ getUserByEmail(${email}) →`, user ? "found" : "not found");
    return user;
  } catch (err) {
    console.error("[DB][Users] ❌ Error in getUserByEmail:", err.message);
    throw err;
  }
}

/**
 * Create a new user.
 * Returns: { id }
 */
export async function createUser({ email, name, password_hash, role = "user" }) {
  try {
    const db = await getDb();
    const result = await db.run(
      `INSERT INTO users (email, name, password_hash, role)
       VALUES (?, ?, ?, ?)`,
      email,
      name ?? null,
      password_hash,
      role
    );

    console.log(`[DB][Users] ✅ createUser(${email}) → id=${result.lastID}`);
    return { id: result.lastID };
  } catch (err) {
    console.error("[DB][Users] ❌ Error in createUser:", err.message);
    throw err;
  }
}

/**
 * Update a user's role.
 * Useful for promoting or demoting admins.
 */
export async function setUserRole(email, role) {
  try {
    const db = await getDb();
    await db.run(`UPDATE users SET role = ? WHERE email = ?`, role, email);
    console.log(`[DB][Users] ✅ setUserRole(${email}) → ${role}`);
  } catch (err) {
    console.error("[DB][Users] ❌ Error in setUserRole:", err.message);
    throw err;
  }
}
