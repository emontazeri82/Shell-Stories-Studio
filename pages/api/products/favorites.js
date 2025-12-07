// pages/api/products/favorites.js
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// Helpers
const MAX_LIMIT = 50;
const DEFAULT_LIMIT = 20;
const MAX_OFFSET = 5000;

const toInt = (v, def = 0) => {
  const n = Number.parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
};
const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
const parseIdList = (s) => {
  if (!s || typeof s !== "string") return [];
  const seen = new Set();
  for (const raw of s.split(",")) {
    const n = Number.parseInt(raw.trim(), 10);
    if (Number.isInteger(n)) seen.add(n);
    if (seen.size >= 50) break;
  }
  return Array.from(seen);
};

// ─────────────────────────────────────────────
// ENHANCED SERVER DEBUGGING LOG HELPERS
// ─────────────────────────────────────────────
const DEBUG = true;
function log(...args) {
  if (DEBUG) console.log("[API /favorites]", ...args);
}

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  res.setHeader("Cache-Control", "no-store");

  // Log incoming request
  log("➡️ Incoming request:", req.query);

  let db;
  try {
    db = await openDB();

    // Parse + sanitize inputs
    const limit = clamp(toInt(req.query.limit, DEFAULT_LIMIT), 1, MAX_LIMIT);
    const offset = clamp(toInt(req.query.offset, 0), 0, MAX_OFFSET);
    const isRandom = req.query.random === "1";
    const minStock = Math.max(0, toInt(req.query.minStock, 1));
    const exclude = parseIdList(req.query.exclude);

    const orderExpr = isRandom ? "RANDOM()" : "created_at DESC, id DESC";
    const notInSql =
      exclude.length > 0 ? ` AND id NOT IN (${exclude.map(() => "?").join(",")})` : "";

    const sql = `
      SELECT id, name, description, price, stock, image_url, category
      FROM products
      WHERE is_active = 1
        AND is_favorite = 1
        AND stock >= ?
        ${notInSql}
      ORDER BY ${orderExpr}
      LIMIT ? OFFSET ?
    `;

    const params = [minStock, ...exclude, limit, offset];

    // ─────────────────────────────────────────────
    // Log parsed inputs + final SQL + params
    // ─────────────────────────────────────────────
    log("Parsed Inputs:", {
      limit,
      offset,
      isRandom,
      minStock,
      exclude,
    });

    log("Final SQL:", sql.replace(/\s+/g, " ").trim());
    log("SQL Params:", params);

    const items = await db.all(sql, params);

    // Log results
    log("⬅️ Query success — count:", items.length);

    return res.status(200).json({ items });
  } catch (e) {
    console.error("[API /favorites] ❌ Error:", e);
    return res.status(500).json({ error: "Failed to load favorites" });
  } finally {
    if (db) {
      try {
        await db.close();
      } catch {}
    }
  }
}


