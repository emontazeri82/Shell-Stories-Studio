// lib/db.js
import { open } from 'sqlite';
import sqlite3 from 'sqlite3';
import path from 'path';

export async function openDB() {
  return open({
    filename: path.join(process.cwd(), 'data', 'shells_shop.db'),
    driver: sqlite3.Database
  });
}

export async function getAllProducts() {
  const db = await openDB();
  return db.all('SELECT * FROM products');
}

export async function getProductById(id) {
  const db = await openDB();
  return db.get('SELECT * FROM products WHERE id = ?', id);
}
