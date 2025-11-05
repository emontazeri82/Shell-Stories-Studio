// /lib/productHelpers.js
import { openDB } from "@/lib/db";
import { ADMIN_FAVORITES_MAX } from "@/lib/constant";

/* ──────────────────────────────
 * Get product by ID
 * ──────────────────────────────*/
export async function getProductById(id) {
  const db = await openDB();
  try {
    const product = await db.get("SELECT * FROM products WHERE id = ?", [id]);
    console.log("🔍 Found product in DB?", product);
    return product;
  } catch (err) {
    console.error("Error fetching product:", err);
    throw new Error("Failed to fetch product");
  }
}

/* ──────────────────────────────
 * Update product fields by ID
 * ──────────────────────────────*/
export async function updateProductById(id, patch) {
  const db = await openDB();

  const ALLOWED = new Set([
    "name",
    "description",
    "price",
    "stock",
    "image_url",
    "image_public_id",
    "category",
    "is_active",
    "is_favorite",
  ]);

  const entries = Object.entries(patch).filter(([k, v]) => ALLOWED.has(k) && v !== undefined);
  if (entries.length === 0) return { changes: 0 };

  const coerced = entries.map(([k, v]) => {
    if (k === "price" || k === "stock") return [k, Number(v)];
    if (k === "is_active" || k === "is_favorite") return [k, Number(v) === 1 ? 1 : 0];
    return [k, v];
  });

  const cols = coerced.map(([k]) => `${k} = ?`).join(", ");
  const vals = coerced.map(([, v]) => v);

  try {
    const result = await db.run(`UPDATE products SET ${cols} WHERE id = ?`, [...vals, id]);
    console.log(`🧩 Updated product id=${id} → ${cols}`);
    return result;
  } catch (err) {
    console.error("❌ Error updating product:", err);
    throw new Error("Failed to update product");
  }
}

/* ──────────────────────────────
 * Toggle favorite (with admin limit)
 * ──────────────────────────────*/
export async function toggleFavorite(id, isFavorite) {
  const db = await openDB();
  try {
    const currentFavoriteCount = await db.get("SELECT COUNT(*) as count FROM products WHERE is_favorite = 1");
    if (currentFavoriteCount.count >= ADMIN_FAVORITES_MAX && isFavorite === 1) {
      throw new Error(`You can only have ${ADMIN_FAVORITES_MAX} favorite products.`);
    }

    const result = await db.run("UPDATE products SET is_favorite = ? WHERE id = ?", [isFavorite, id]);
    console.log(`⭐ Toggled favorite for id=${id} → ${isFavorite}`);
    return result;
  } catch (err) {
    console.error("Error toggling favorite:", err);
    throw new Error("Failed to update favorite status");
  }
}


