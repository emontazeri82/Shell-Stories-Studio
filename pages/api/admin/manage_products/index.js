// /pages/api/admin/manage_products/index.js
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { createAdminHandler } from "@/lib/middleware/createAdminHandler";

const handler = createAdminHandler();

// 🧠 Database setup
const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

/* ───────────────────────────────
   ✅ GET: List all products
─────────────────────────────── */
handler.get(async (req, res) => {
  console.log(`[${req.rid}] 🧠 handler.get /api/admin/manage_products triggered`);

  const db = await openDB();

  // ✅ check if "created_at" exists; fallback to "id"
  let rows;
  try {
    rows = await db.all("SELECT * FROM products ORDER BY created_at DESC");
  } catch (err) {
    console.warn("⚠️ 'created_at' column missing — ordering by id DESC instead.");
    rows = await db.all("SELECT * FROM products ORDER BY id DESC");
  }

  console.log(`[${req.rid}] ✅ Retrieved ${rows.length} products`);
  res.status(200).json({
    ok: true,
    success: true,
    total: rows.length,
    totalPages: 1,
    products: rows,
  });

  return; // ✅ stop the middleware chain
});

/* ───────────────────────────────
   ✅ POST: Create new product
─────────────────────────────── */
handler.post(async (req, res) => {
  console.log(`[${req.rid}] [DEBUG] handler.post /api/admin/manage_products called`);

  const db = await openDB();

  // 🧹 Validate input
  const product = {
    name: req.body?.name || "",
    description: req.body?.description || "",
    price: Number(req.body?.price) || 0,
    stock: Number(req.body?.stock) || 0,
    category: req.body?.category || "uncategorized",
    image_url: req.body?.image_url || "",
    image_public_id: req.body?.image_public_id || "",
    is_active: 0,
    is_favorite: 0,
  };

  console.log(`[${req.rid}] 🧾 Sanitized product:`, product);

  try {
    const result = await db.run(
      `INSERT INTO products (
        name, description, price, stock, category,
        image_url, image_public_id, is_active, is_favorite
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        product.name,
        product.description,
        product.price,
        product.stock,
        product.category,
        product.image_url,
        product.image_public_id,
        product.is_active,
        product.is_favorite,
      ]
    );

    console.log(`[${req.rid}] ✅ [DB] Product inserted:`, {
      id: result.lastID,
      name: product.name,
      price: product.price,
    });

    res.status(201).json({
      ok: true,
      success: true,
      message: "Product created successfully",
      product: { id: result.lastID, ...product },
    });

    return; // ✅ stops next-connect from continuing
  } catch (err) {
    console.error(`[${req.rid}] ❌ DB insert failed:`, err);
    res.status(500).json({
      ok: false,
      success: false,
      error: "Failed to insert product",
      details: err.message,
    });
    return; // ✅ stop chain
  }
});

export default handler.attachFallback();












