// lib/productApiUtils.js
import { openDB } from "./db";

/**
 * Inserts a new product safely with defaults.
 * Always includes created_at timestamp.
 */
export async function insertProduct(product) {
  const db = await openDB();

  const {
    name = "",
    description = "",
    price = 0,
    stock = 0,
    image_url = null,
    category = "",
    is_active = 1,
    is_favorite = 0,
  } = product || {};

  const stmt = `
    INSERT INTO products 
      (name, description, price, stock, image_url, category, is_active, is_favorite, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
  `;

  const result = await db.run(stmt, [
    name.trim(),
    description.trim(),
    Number(price),
    Number(stock),
    image_url,
    category.trim(),
    Number(is_active),
    Number(is_favorite),
  ]);

  console.log("✅ [DB] Product inserted:", { id: result.lastID, name, price, category });
  return result;
}

/**
 * Fetch paginated products with total count.
 * Supports sorting and optional search query (q).
 */
export async function getPaginatedProducts(page = 1, limit = 20, sortSQL = "created_at DESC", q = "") {
  const db = await openDB();
  const offset = (Number(page) - 1) * Number(limit);
  const rid = Math.random().toString(36).slice(2, 8);
  const t0 = Date.now();

  try {
    console.log(`[db] [${rid}] ▶ start getPaginatedProducts { page=${page}, limit=${limit}, sortSQL='${sortSQL}', q='${q}' }`);

    // Optional search
    let whereClause = "";
    let params = [];
    if (q && typeof q === "string" && q.trim() !== "") {
      whereClause = `WHERE name LIKE ? OR description LIKE ? OR category LIKE ?`;
      const like = `%${q.trim()}%`;
      params = [like, like, like];
    }

    // Count total
    const tCount = Date.now();
    const countRow = await db.get(`SELECT COUNT(*) AS count FROM products ${whereClause}`, params);
    const totalCount = countRow?.count || 0;
    console.log(`[db] [${rid}] count query done in ${Date.now() - tCount}ms total=${totalCount}`);

    // Fetch products
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

    // Normalize
    const products = rows.map((p) => ({
      id: Number(p.id),
      name: p.name || "",
      description: p.description || "",
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      image_url: p.image_url || "",
      category: p.category || "",
      is_favorite: Number(p.is_favorite || 0),
      is_active: Number(p.is_active ?? 1),
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


