import { openDB } from './db';

/**
 * Inserts a new product into the database.
 * Returns sqlite result object with lastID.
 */
export async function insertProduct(product) {
  const db = await openDB();
  const { name, description, price, stock, image_url, category } = product;

  const stmt = `
    INSERT INTO products (name, description, price, stock, image_url, category)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  return await db.run(stmt, [name, description, price, stock, image_url, category]);
}

/**
 * Fetch paginated products with total count.
 * Supports sorting and optional search query (q).
 * Logs precise timings for performance tracking.
 */
export async function getPaginatedProducts(page = 1, limit = 20, sortSQL = 'created_at DESC', q = '') {
  const db = await openDB();
  const offset = (Number(page) - 1) * Number(limit);
  const rid = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();

  try {
    console.log(`[db] [${rid}] ▶ start getPaginatedProducts { page=${page}, limit=${limit}, sortSQL='${sortSQL}', q='${q}' }`);

    // 1️⃣ Prepare optional search clause
    let whereClause = '';
    let params = [];
    if (q && typeof q === 'string' && q.trim() !== '') {
      whereClause = `WHERE name LIKE ? OR description LIKE ? OR category LIKE ?`;
      const like = `%${q.trim()}%`;
      params = [like, like, like];
    }

    // 2️⃣ Count total
    const tCount = Date.now();
    const countRow = await db.get(`SELECT COUNT(*) AS count FROM products ${whereClause}`, params);
    const totalCount = countRow?.count || 0;
    console.log(`[db] [${rid}] count query done in ${Date.now() - tCount}ms total=${totalCount}`);

    // 3️⃣ Fetch page rows
    const tSelect = Date.now();
    const rows = await db.all(
      `
      SELECT id, name, description, price, stock, image_url, category, is_favorite, is_active, created_at
      FROM products
      ${whereClause}
      ORDER BY ${sortSQL}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    console.log(`[db] [${rid}] select done in ${Date.now() - tSelect}ms rows=${rows.length}`);

    // 4️⃣ Normalize result
    const products = rows.map((p) => ({
      id: Number(p.id),
      name: p.name || '',
      description: p.description || '',
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      image_url: p.image_url || '',
      category: p.category || '',
      is_favorite: Number(p.is_favorite || 0),
      is_active: Number(p.is_active ?? 1), // default active
      created_at: p.created_at || null,
    }));

    const totalPages = Math.ceil(totalCount / limit) || 1;
    console.log(`[db] [${rid}] ✅ success totalMs=${Date.now() - t0} total=${totalCount}`);

    return {
      products,
      total: totalCount,
      page: Number(page),
      totalPages,
    };
  } catch (err) {
    console.error(`[db] [${rid}] ❌ getPaginatedProducts error:`, err);
    throw err;
  }
}

/**
 * Updates activation status of a product.
 */
export async function updateProductStatus(id, is_active) {
  const db = await openDB();
  const result = await db.run(
    `UPDATE products SET is_active = ? WHERE id = ?`,
    [Number(is_active), Number(id)]
  );
  return result;
}

/**
 * Deletes a product by ID.
 */
export async function deleteProductById(id) {
  const db = await openDB();
  return db.run(`DELETE FROM products WHERE id = ?`, [Number(id)]);
}

