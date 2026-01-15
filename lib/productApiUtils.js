// /lib/productApiUtils.js
import { openDB } from "./db";

/* ──────────────────────────────
 * Insert Product
 * ──────────────────────────────*/
/**
 * Inserts a new product safely with defaults.
 * Always includes created_at timestamp.
 * Returns { lastID } for potential use with product_media linking.
 */
export async function insertProduct(product = {}) {
  const db = await openDB();
  const rid = Math.random().toString(36).slice(2, 8);

  try {
    const {
      name = "",
      description = "",
      price = 0,
      stock = 0,
      image_url = null,
      category = "",
      is_active = 1,
      is_favorite = 0,
      discount_percent = 0,
      discount_active = 0,
    } = product;

    const stmt = `
      INSERT INTO products 
        (name, description, price, stock, image_url, category, is_active, is_favorite, discount_percent, discount_active, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, datetime('now'))
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
      Number(discount_percent),
      Number(discount_active),
    ]);

    console.log(`[DB] [${rid}] ✅ Product inserted id=${result.lastID} name="${name}"`);
    return { id: result.lastID };
  } catch (err) {
    console.error(`[DB] [${rid}] ❌ insertProduct failed:`, err);
    throw err;
  } finally {
    await db.close();
  }
}
/* ──────────────────────────────
 * Create Product with Media (atomic transaction)
 * ──────────────────────────────*/
// ⚠️ Optional: keep for later activation
export async function createProductWithMedia(product, mediaItems) {
  const db = await openDB();
  try {
    await db.exec("BEGIN TRANSACTION");
    const { id } = await insertProduct(product);
    for (const m of mediaItems) {
      await db.run(`
        INSERT INTO product_media (product_id, kind, public_id, secure_url, format, sort_order, is_primary)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `, [id, m.kind, m.public_id, m.secure_url, m.format, m.sort_order || 0, m.is_primary ? 1 : 0]);
    }
    await db.exec("COMMIT");
    console.log(`[DB] ✅ createProductWithMedia committed for product ${id}`);
    return id;
  } catch (err) {
    await db.exec("ROLLBACK");
    console.error("[DB] ❌ createProductWithMedia rolled back:", err);
    throw err;
  } finally {
    await db.close();
  }
}
/* ──────────────────────────────
 * Paginated Products
 * ──────────────────────────────*/
/**
 * Fetch paginated products with total count.
 * Supports sorting and optional search query.
 * Ready for integration with Redis caching layer.
 */
export async function getPaginatedProducts(page = 1, limit = 20, sortSQL = "created_at DESC", q = "") {
  const db = await openDB();
  const rid = Math.random().toString(36).slice(2, 8);
  const offset = (Number(page) - 1) * Number(limit);
  const t0 = Date.now();

  try {
    console.log(`[DB] [${rid}] ▶ start getPaginatedProducts { page=${page}, limit=${limit}, sortSQL='${sortSQL}', q='${q}' }`);

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
    console.log(`[DB] [${rid}] count query done in ${Date.now() - tCount}ms total=${totalCount}`);

    // Fetch products
    const tSelect = Date.now();
    const rows = await db.all(
      `
      SELECT id, name, description, price, stock, image_url, category, discount_percent, discount_active, is_favorite, is_active, created_at
      FROM products
      ${whereClause}
      ORDER BY ${sortSQL}
      LIMIT ? OFFSET ?
      `,
      [...params, Number(limit), Number(offset)]
    );

    console.log(`[DB] [${rid}] select done in ${Date.now() - tSelect}ms rows=${rows.length}`);

    // Normalize output
    const products = rows.map((p) => ({
      id: Number(p.id),
      name: p.name || "",
      description: p.description || "",
      price: Number(p.price || 0),
      stock: Number(p.stock || 0),
      image_url: p.image_url || "",
      category: p.category || "",

      // ✅ discount fields
      discount_percent: Number(p.discount_percent || 0),
      discount_active: Number(p.discount_active || 0),

      is_favorite: Number(p.is_favorite || 0),
      is_active: Number(p.is_active ?? 1),
      created_at: p.created_at || null,
    }));


    const totalPages = Math.ceil(totalCount / limit) || 1;
    console.log(`[DB] [${rid}] ✅ success totalMs=${Date.now() - t0} total=${totalCount}`);

    return {
      products,
      total: totalCount,
      page: Number(page),
      totalPages,
    };
  } catch (err) {
    console.error(`[DB] [${rid}] ❌ getPaginatedProducts error:`, err);
    throw err;
  } finally {
    await db.close();
  }
}

/* ──────────────────────────────
 * Update Product Active Status
 * ──────────────────────────────*/
export async function updateProductStatus(id, is_active) {
  const db = await openDB();
  const rid = Math.random().toString(36).slice(2, 8);

  try {
    const result = await db.run(`UPDATE products SET is_active = ? WHERE id = ?`, [
      Number(is_active),
      Number(id),
    ]);
    console.log(`[DB] [${rid}] ✅ updateProductStatus id=${id} active=${is_active}`);
    return result;
  } catch (err) {
    console.error(`[DB] [${rid}] ❌ updateProductStatus failed:`, err);
    throw err;
  } finally {
    await db.close();
  }
}

/* ──────────────────────────────
 * Delete Product by ID
 * ──────────────────────────────*/
export async function deleteProductById(id) {
  const db = await openDB();
  const rid = Math.random().toString(36).slice(2, 8);

  try {
    const result = await db.run(`DELETE FROM products WHERE id = ?`, [Number(id)]);
    console.log(`[DB] [${rid}] 🗑️ Product deleted id=${id}`);
    return result;
  } catch (err) {
    console.error(`[DB] [${rid}] ❌ deleteProductById failed:`, err);
    throw err;
  } finally {
    await db.close();
  }
}


