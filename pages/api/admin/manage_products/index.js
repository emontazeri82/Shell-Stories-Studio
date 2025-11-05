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

export default handler.attachFallback();












