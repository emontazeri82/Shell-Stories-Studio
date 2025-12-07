// pages/api/setup.js
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import argon2 from 'argon2';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON'); // ✅ Fix 1: ensure FK ON
  return db;
}

/* ---------- helpers to migrate safely ---------- */
async function hasColumn(db, table, col) {
  const rows = await db.all(`PRAGMA table_info(${table});`);
  return rows.some(r => r.name === col);
}

async function ensureColumn(db, table, colDef) {
  const name = colDef.trim().split(/\s+/)[0];
  if (!(await hasColumn(db, table, name))) {
    await db.exec(`ALTER TABLE ${table} ADD COLUMN ${colDef};`);
  }
}

async function ensureIndex(db, name, sql) {
  try {
    await db.exec(sql);
  } catch (e) {
    console.warn(`⚠️ Index ${name} skipped:`, e?.message);
  }
}

/* ---------- create + migrate schema ---------- */
async function createTables(db) {

  /* ------------------ PRODUCTS TABLE ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL DEFAULT 0 CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      image_url TEXT,
      image_public_id TEXT,
      category TEXT DEFAULT 'decor',
      is_active INTEGER DEFAULT 1 CHECK (is_active IN (0,1)),
      is_favorite INTEGER DEFAULT 0 CHECK (is_favorite IN (0,1)),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // ✅ Fix 2: add updated_at column if missing
  const prodCols = await db.all(`PRAGMA table_info(products)`);
  if (!prodCols.some(c => c.name === "updated_at")) {
    await db.exec(`ALTER TABLE products ADD COLUMN updated_at TEXT;`);
    await db.exec(`UPDATE products SET updated_at = datetime('now');`);
  }

  // ✅ Fix 3: trigger for updated_at
  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS products_update_timestamp
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
      UPDATE products
      SET updated_at = datetime('now')
      WHERE id = OLD.id;
    END;
  `);

  /* ------------------ PRODUCT MEDIA TABLE ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS product_media (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      product_id INTEGER NOT NULL,
      kind TEXT NOT NULL CHECK (kind IN ('image','video')),
      public_id TEXT NOT NULL,
      secure_url TEXT NOT NULL,
      format TEXT,
      width INTEGER,
      height INTEGER,
      duration REAL,
      alt TEXT,
      sort_order INTEGER NOT NULL DEFAULT 0,
      is_primary INTEGER NOT NULL DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  // Fix 4: ensure missing columns exist if older schema
  await ensureColumn(db, 'product_media', 'sort_order INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'product_media', 'is_primary INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'product_media', 'alt TEXT');
  await ensureColumn(db, 'product_media', 'format TEXT');
  await ensureColumn(db, 'product_media', 'width INTEGER');
  await ensureColumn(db, 'product_media', 'height INTEGER');
  await ensureColumn(db, 'product_media', 'duration REAL');

  // Fix 5: backfill NULLs safely
  await db.exec(`
    UPDATE product_media SET sort_order = COALESCE(sort_order, 0) WHERE sort_order IS NULL;
    UPDATE product_media SET is_primary = COALESCE(is_primary, 0) WHERE is_primary IS NULL;
  `);

  // Fix 6: correct indexes
  await ensureIndex(
    db,
    'idx_pm_product_id',
    `CREATE INDEX IF NOT EXISTS idx_pm_product_id ON product_media(product_id);`
  );

  await ensureIndex(
    db,
    'idx_pm_primary_order',
    `CREATE INDEX IF NOT EXISTS idx_pm_primary_order
       ON product_media(product_id, is_primary, sort_order, id);`
  );

  /* ------------------ CART ITEMS TABLE ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS cart_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      session_id TEXT,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL CHECK (quantity > 0),
      added_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  /* ------------------ ORDERS TABLE ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      session_id TEXT NOT NULL,
      paypal_order_id TEXT,
      email TEXT,
      customer_name TEXT,
      phone TEXT,
      total_price REAL NOT NULL,
      payment_status TEXT DEFAULT 'Pending',
      shipping_address TEXT NOT NULL,
      billing_address TEXT NOT NULL,
      payment_method TEXT DEFAULT 'Card',
      delivery_method TEXT DEFAULT 'standard',
      purchase_status TEXT DEFAULT 'Processing',
      delivered_status TEXT DEFAULT 'Not Delivered',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  /* ------------------ ORDER ITEMS TABLE ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  /* ------------------ SHIPPING DETAILS TABLE ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      tracking_number TEXT,
      carrier TEXT,
      shipping_status TEXT DEFAULT 'Pending',
      shipped_at TIMESTAMP,
      delivered_at TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  // ⭐⭐⭐ CRITICAL FIX ⭐⭐⭐
  // Prevent duplicate shipping rows
  await ensureIndex(
    db,
    'uniq_shipping_order',
    `CREATE UNIQUE INDEX IF NOT EXISTS uniq_shipping_order
       ON shipping_details(order_id);`
  );

  /* ------------------ USERS TABLE ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}

/* ------------------ ADMIN USER ------------------ */
async function populateRoles(db) {
  const hashedPassword = await argon2.hash('ghazalgxz123');
  await db.run(
    `INSERT OR IGNORE INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['ghazal.montazeri@gmail.com', 'Ghazal', hashedPassword, 'admin']
  );
  console.log('✅ Admin user inserted (if not exists)');
}

/* ------------------ API HANDLER ------------------ */
export default async function handler(req, res) {
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  try {
    const db = await openDB();
    await createTables(db);
    await populateRoles(db);
    res.status(200).json({ message: 'Database setup complete (safe migrations applied)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database setup failed' });
  }
}




