// lib/productHelpers.js
import { openDB } from './db'; // Assuming your openDB function is in lib/db.js
import { ADMIN_FAVORITES_MAX } from './constant';
// Fetch a product by ID
export async function getProductById(id) {
  const db = await openDB();
  try {
    const product = await db.get('SELECT * FROM products WHERE id = ?', [id]);
    console.log("🔍 Found product in DB?", product);
    return product;
  } catch (err) {
    console.error('Error fetching product:', err);
    throw new Error('Failed to fetch product');
  }
}

// lib/productHelpers.js

export async function updateProductById(id, patch) {
  const db = await openDB();

  // Columns we allow to be updated
  const ALLOWED = new Set([
    'name',
    'description',
    'price',
    'stock',
    'image_url',
    'image_public_id',
    'category',
    'is_active',
    'is_favorite',
  ]);

  // Keep only allowed keys with defined values
  const entries = Object.entries(patch).filter(
    ([k, v]) => ALLOWED.has(k) && v !== undefined
  );

  if (entries.length === 0) return { changes: 0 };

  // Optional: coerce some types defensively (safe no-ops if already correct)
  const coerced = entries.map(([k, v]) => {
    if (k === 'price') return [k, Number(v)];
    if (k === 'stock') return [k, Number(v)];
    if (k === 'is_active' || k === 'is_favorite') return [k, Number(v) === 1 ? 1 : 0];
    return [k, v];
  });

  const cols = coerced.map(([k]) => `${k} = ?`).join(', ');
  const vals = coerced.map(([, v]) => v);

  // Debug: see exactly what you are updating
  // console.log('🧩 UPDATE products SET', cols, 'WHERE id =', id, 'vals =', vals);

  try {
    const result = await db.run(
      `UPDATE products SET ${cols} WHERE id = ?`,
      [...vals, id]
    );
    return result; // { changes, lastID }
  } catch (err) {
    console.error('❌ Error updating product:', err);
    throw new Error('Failed to update product');
  }
}


// Delete product by ID
export async function deleteProductById(id) {
  const db = await openDB();
  console.log('🗑️ Trying to delete product from DB with id:', id);

  try {
    const result = await db.run('DELETE FROM products WHERE id = ?', [id]);
    console.log('🧾 SQLite delete result:', result);

    return result;
  } catch (err) {
    console.error('Error deleting product:', err);
    throw new Error('Failed to delete product');
  }
}

// Toggle favorite status for a product
export async function toggleFavorite(id, isFavorite) {
  const db = await openDB();
  try {
    const currentFavoriteCount = await db.get('SELECT COUNT(*) as count FROM products WHERE is_favorite = 1');

    // Limit favorites to 8 products
    if (currentFavoriteCount.count >= ADMIN_FAVORITES_MAX && isFavorite === 1) {
      throw new Error(`You can only have ${ADMIN_FAVORITES_MAX} favorite products.`);
    }

    const result = await db.run('UPDATE products SET is_favorite = ? WHERE id = ?', [isFavorite, id]);
    return result;
  } catch (err) {
    console.error('Error toggling favorite:', err);
    throw new Error('Failed to update favorite status');
  }
}

// Bulk create products (inserts multiple products at once)
export async function bulkCreateProducts(products) {
  const db = await openDB();
  try {
    const stmt = await db.prepare(`
      INSERT INTO products (name, description, price, stock, image_url, category, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    for (const product of products) {
      const { name, description, price, stock, image_url, category, is_active } = product;
      await stmt.run(name, description, price, stock, image_url, category, is_active);
    }
    await stmt.finalize();
    return { message: 'Products created successfully' };
  } catch (err) {
    console.error('Error bulk creating products:', err);
    throw new Error('Failed to bulk create products');
  }
}

