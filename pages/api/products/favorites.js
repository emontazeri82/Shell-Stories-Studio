// pages/api/products/favorites.js
const sqlite3 = require("sqlite3");
const { open } = require("sqlite");
const path = require("path");

const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
const openDB = () => open({ filename: dbPath, driver: sqlite3.Database });

// --- helpers (sanitize/clamp) ---
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
  // allow only integers, de-dupe, cap length to avoid huge IN clauses
  const seen = new Set();
  for (const raw of s.split(",")) {
    const n = Number.parseInt(raw.trim(), 10);
    if (Number.isInteger(n)) seen.add(n);
    if (seen.size >= 50) break;
  }
  return Array.from(seen);
};

export default async function handler(req, res) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ error: "Method not allowed" });
  }

  // cache policy: dynamic by default
  res.setHeader("Cache-Control", "no-store");

  let db;
  try {
    db = await openDB();

    // ---- sanitize inputs
    const limit = clamp(toInt(req.query.limit, DEFAULT_LIMIT), 1, MAX_LIMIT);
    const offset = clamp(toInt(req.query.offset, 0), 0, MAX_OFFSET);
    const isRandom = req.query.random === "1"; // strict toggle
    const minStock = Math.max(0, toInt(req.query.minStock, 1)); // default: only in-stock
    const exclude = parseIdList(req.query.exclude); // e.g. ?exclude=1,2,3

    // safe, fixed ORDER BY (no user injection)
    const orderExpr = isRandom ? "RANDOM()" : "created_at DESC, id DESC";

    // build SQL with a safe, parameterized NOT IN if exclude[] present
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

    const items = await db.all(sql, params);

    return res.status(200).json({ items });
  } catch (e) {
    console.error("favorites api error", e);
    return res.status(500).json({ error: "Failed to load favorites" });
  } finally {
    // close the DB handle to avoid descriptor leaks in dev/long runs
    if (db) {
      try { await db.close(); } catch {}
    }
  }
}

