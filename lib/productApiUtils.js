// lib/productApiUtils.js
import { openDB } from './db';

export async function insertProduct(product) {
  const db = await openDB();
  const { name, description, price, stock, image_url, category } = product;

  return await db.run(
    `INSERT INTO products (name, description, price, stock, image_url, category)
     VALUES (?, ?, ?, ?, ?, ?)`,
    [name, description, price, stock, image_url, category]
  );
}

export async function getPaginatedProducts(page = 1, limit = 20, sortSQL = 'created_at DESC') {
  const db = await openDB();
  const offset = (page - 1) * limit;

  const countResult = await db.get(`SELECT COUNT(*) as count FROM products`);
  const totalCount = countResult.count;

  const rawproducts = await db.all(
    `SELECT id, name, description, price, stock, image_url, category, is_favorite, is_active, created_at
     FROM products
     ORDER BY ${sortSQL}
     LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)]
  );


  // 🔧 Normalize `is_favorite` to number (0 or 1)
  const products = rawproducts.map(product => ({
    ...product,
    is_favorite: Number(product.is_favorite || 0), // ensure it's 0 or 1
  }));

  return {
    products,
    total: totalCount,
    page: parseInt(page),
    totalPages: Math.ceil(totalCount / limit),
  };
}

export async function updateProductStatus(id, is_active) {
  const db = await openDB();
  return db.run(`UPDATE products SET is_active = ? WHERE id = ?`, [is_active, id]);
}