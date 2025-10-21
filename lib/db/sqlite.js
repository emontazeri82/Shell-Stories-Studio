// /lib/db/sqlite.js
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';

// Optional: allow override via env; default to your known path
const DB_FILE = process.env.DB_FILE || path.join(process.cwd(), 'data', 'shells_shop.db');

let _dbPromise = null;

export async function getDb() {
  if (_dbPromise) return _dbPromise;
  _dbPromise = open({
    filename: DB_FILE,
    driver: sqlite3.Database,
  });

  // Pragmas that are safe/helpful
  const db = await _dbPromise;
  await db.exec('PRAGMA foreign_keys = ON;');
  return db;
}
