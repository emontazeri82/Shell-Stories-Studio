import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import path from 'path';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

export default async function handler(req, res) {
  const db = await openDB();
  const products = await db.all('SELECT * FROM products');
  res.status(200).json(products);
}