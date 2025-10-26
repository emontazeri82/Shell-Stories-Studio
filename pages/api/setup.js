// pages/api/setup.js
import path from 'path';
import sqlite3 from 'sqlite3';
import { open } from 'sqlite';
import argon2 from 'argon2';

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec('PRAGMA foreign_keys = ON');
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
  // Use IF NOT EXISTS in SQL; wrap in try/catch so re-runs don't explode
  try { await db.exec(sql); } catch (e) {
    console.warn(`⚠️ Index ${name} skipped:`, e?.message || e);
  }
}

/* ---------- create + migrate schema ---------- */
async function createTables(db) {
  // products (kept compatible with your app)
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

  // 2️⃣ Add updated_at column if missing
  const columns = await db.all(`PRAGMA table_info(products)`);
  const hasUpdatedAt = columns.some((c) => c.name === "updated_at");

  if (!hasUpdatedAt) {
    console.log("🪄 Adding missing 'updated_at' column...");
    await db.exec(`ALTER TABLE products ADD COLUMN updated_at TEXT;`);
    await db.exec(`UPDATE products SET updated_at = datetime('now');`);
  }

  // 3️⃣ Create trigger to auto-update updated_at on change
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

  // product_media (now includes is_primary)
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

  // If the table already existed (from your older setup), add any missing columns
  await ensureColumn(db, 'product_media', 'sort_order INTEGER NOT NULL DEFAULT 0');
  await ensureColumn(db, 'product_media', 'is_primary INTEGER NOT NULL DEFAULT 0');
  // Optional: add these only if you need them and they’re missing
  await ensureColumn(db, 'product_media', 'alt TEXT');
  await ensureColumn(db, 'product_media', 'format TEXT');
  await ensureColumn(db, 'product_media', 'width INTEGER');
  await ensureColumn(db, 'product_media', 'height INTEGER');
  await ensureColumn(db, 'product_media', 'duration REAL');

  // Backfill NULLs (defensive; ALTER adds defaults for new rows only)
  await db.exec(`
    UPDATE product_media SET sort_order = COALESCE(sort_order, 0) WHERE sort_order IS NULL;
    UPDATE product_media SET is_primary = COALESCE(is_primary, 0) WHERE is_primary IS NULL;
  `);

  // Indexes (order & lookups)
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

  // Optional (enforce at most one primary per product at the DB level).
  // Commented out by default to avoid failures if you temporarily have 2 primaries.
  // When you’re ready (no duplicates), uncomment:
  /*
  await ensureIndex(
    db,
    'uniq_pm_one_primary',
    "CREATE UNIQUE INDEX IF NOT EXISTS uniq_pm_one_primary ON product_media(product_id) WHERE is_primary = 1;"
  );
  */

  // other tables (unchanged)
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
    

    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );

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

async function populateRoles(db) {
  const hashedPassword = await argon2.hash('ghazalgxz123');
  await db.run(
    `INSERT OR IGNORE INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?)`,
    ['ghazal.montazeri@gmail.com', 'Ghazal', hashedPassword, 'admin']
  );
  console.log('✅ Admin user inserted (if not exists)');
}

async function populateProducts(db) {
  try {
    await db.run(`
      INSERT OR IGNORE INTO products (name, description, price, stock, image_url, category, is_active) VALUES
      ('Butterfly Shell', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image1.jpg', 'floral', 1),
      ('Floral Shell', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image2.jpg', 'floral', 1),
      ('Butterfly & Rose Shell', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image3.jpg', 'rose', 1),
      ('Floral Shell Set', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image4.jpg', 'floral', 1),
      ('Hummingbird Shell', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image5.jpg', 'bird', 1),
      ('Lavender Shell', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image6.jpg', 'lavender', 1),
      ('Blue Floral Shell', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image7.jpg', 'floral', 1),
      ('Purple Floral Shell', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image8.jpg', 'floral', 1),
      ('Hummingbird Set', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image9.jpg', 'bird', 1),
      ('Golden Flight', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image10.jpg', 'bird', 1),
      ('Vibrant Hummingbird', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image11.jpg', 'bird', 1),
      ('Purple Bloom', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image12.jpg', 'floral', 1),
      ('Personalized Butterfly', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image13.jpg', 'custom', 1),
      ('Watercolor Floral', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image14.jpg', 'floral', 1),
      ('Hummingbird Shell 2', 'Handmade shell decorative', 24.95, 1, '/assets/images/products/image15.jpg', 'bird', 1);
    `);
  } catch (err) {
    console.error('Error populating products:', err);
  }
}

export default async function handler(req, res) {
  // 🚫 Block access in production
  if (process.env.NODE_ENV !== 'development') {
    return res.status(403).json({ error: 'Not allowed in production' });
  }

  try {
    const db = await openDB();
    await createTables(db);
    await populateRoles(db);
    await populateProducts(db);
    res.status(200).json({ message: 'Database setup complete (product_media has is_primary & indexes)' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database setup failed' });
  }
}




