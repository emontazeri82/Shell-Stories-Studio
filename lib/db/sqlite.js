// /lib/db/sqlite.js
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";

const DB_FILE =
  process.env.DB_FILE || path.join(process.cwd(), "data", "shells_shop.db");

let _dbPromise = null;

/**
 * Opens (or reuses) the SQLite connection.
 * Includes error logging and foreign key enforcement.
 */
export async function getDb() {
  try {
    if (_dbPromise) return _dbPromise;

    console.log(`[DB] 🗄️ Opening SQLite connection at: ${DB_FILE}`);

    _dbPromise = open({
      filename: DB_FILE,
      driver: sqlite3.Database,
    });

    const db = await _dbPromise;

    // Enforce foreign key integrity
    await db.exec("PRAGMA foreign_keys = ON;");

    console.log("[DB] ✅ SQLite connection ready");
    return db;
  } catch (err) {
    console.error("[DB] ❌ Failed to open SQLite database:", err.message);
    throw new Error(`Database connection failed: ${err.message}`);
  }
}
