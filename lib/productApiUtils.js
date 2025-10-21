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

// 🧾 Get Paginated Products
export async function getPaginatedProducts(page = 1, limit = 20, sortSQL = 'created_at DESC', q = '') {
  const rid = Math.random().toString(36).slice(2, 8);
  console.log(`[db] [${rid}] start getPaginatedProducts`, { page, limit, sortSQL, q });

  const db = await openDB();
  const offset = (page - 1) * limit;
  const countStart = Date.now();

  const countResult = await db.get(`SELECT COUNT(*) as count FROM products`);
  const totalCount = countResult.count;
  const countMs = Date.now() - countStart;

  console.log(`[db] [${rid}] count query done in ${countMs}ms total=${totalCount}`);

  const selectStart = Date.now();
  const rawproducts = await db.all(
    `SELECT id, name, description, price, stock, image_url, category, is_favorite, is_active, created_at
     FROM products
     ORDER BY ${sortSQL}
     LIMIT ? OFFSET ?`,
    [parseInt(limit), parseInt(offset)]
  );
  const selectMs = Date.now() - selectStart;

  // Normalize
  const products = rawproducts.map((p) => ({
    ...p,
    is_favorite: Number(p.is_favorite || 0),
  }));

  console.log(`[db] [${rid}] select done in ${selectMs}ms rows=${products.length}`);

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
