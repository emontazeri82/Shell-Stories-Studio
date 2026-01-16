// pages/api/setup.js
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import argon2 from "argon2";

const dbPath = path.join(process.cwd(), "data", "shells_shop.db");

async function openDB() {
  const db = await open({ filename: dbPath, driver: sqlite3.Database });
  await db.exec("PRAGMA foreign_keys = ON");
  return db;
}

async function createTables(db) {

  /* ------------------ PRODUCTS ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      price REAL NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL DEFAULT 0 CHECK (stock >= 0),
      image_url TEXT,
      image_public_id TEXT,
      category TEXT DEFAULT 'decor',
      discount_percent INTEGER DEFAULT 0 CHECK (discount_percent BETWEEN 0 AND 100),
      discount_active INTEGER DEFAULT 0 CHECK (discount_active IN (0,1)),
      is_active INTEGER DEFAULT 1 CHECK (is_active IN (0,1)),
      is_favorite INTEGER DEFAULT 0 CHECK (is_favorite IN (0,1)),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`
    CREATE TRIGGER IF NOT EXISTS products_update_timestamp
    AFTER UPDATE ON products
    FOR EACH ROW
    BEGIN
      UPDATE products SET updated_at = datetime('now') WHERE id = OLD.id;
    END;
  `);
  // ✅ PRODUCT INDEXES (ADD HERE)
  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_active
    ON products(is_active);
  `);

  await db.exec(`
    CREATE INDEX IF NOT EXISTS idx_products_active_discount
    ON products(is_active, discount_active);
  `);
  /* ------------------ PRODUCT MEDIA ------------------ */
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
      sort_order INTEGER DEFAULT 0,
      is_primary INTEGER DEFAULT 0,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_pm_product_id ON product_media(product_id);`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_pm_primary_order ON product_media(product_id, is_primary, sort_order);`);

  /* ------------------ CART ITEMS ------------------ */
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

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_cart_session_id ON cart_items(session_id);`);

  /* ------------------ ORDERS ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS orders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER,
      session_id TEXT NOT NULL,
      paypal_order_id TEXT,
      email TEXT,
      customer_name TEXT,
      phone TEXT,
      total_price REAL NOT NULL CHECK (total_price >= 0),
      payment_status TEXT DEFAULT 'Pending',
      payment_method TEXT DEFAULT 'Card',
      delivery_method TEXT DEFAULT 'standard',
      purchase_status TEXT DEFAULT 'Processing',
      delivered_status TEXT DEFAULT 'Not Delivered',
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_session_id ON orders(session_id);`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_paypal_order_id ON orders(paypal_order_id);`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_created_at ON orders(created_at DESC);`);
  await db.exec(`CREATE INDEX IF NOT EXISTS idx_orders_delivery_method ON orders(delivery_method);`);

  /* ------------------ ORDER SHIPPING ADDRESSES ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_shipping_addresses (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      name TEXT NOT NULL,
      phone TEXT,
      address_1 TEXT NOT NULL,
      address_2 TEXT,
      city TEXT NOT NULL,
      state TEXT,
      postal_code TEXT NOT NULL,
      country TEXT NOT NULL,
      source TEXT NOT NULL CHECK (source IN ('paypal','manual')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  /* ------------------ ORDER ITEMS ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS order_items (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL,
      product_id INTEGER NOT NULL,
      quantity INTEGER NOT NULL,
      price REAL NOT NULL CHECK (price >= 0),
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE,
      FOREIGN KEY (product_id) REFERENCES products(id) ON DELETE CASCADE
    );
  `);

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON order_items(order_id);`);

  /* ------------------ SHIPPING DETAILS ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS shipping_details (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      order_id INTEGER NOT NULL UNIQUE,
      tracking_number TEXT,
      carrier TEXT,
      shipping_status TEXT DEFAULT 'Pending',
      shipped_at TIMESTAMP,
      delivered_at TIMESTAMP,
      FOREIGN KEY (order_id) REFERENCES orders(id) ON DELETE CASCADE
    );
  `);

  await db.exec(`CREATE INDEX IF NOT EXISTS idx_shipping_status ON shipping_details(shipping_status);`);

  /* ------------------ USERS ------------------ */
  await db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      name TEXT,
      password_hash TEXT,
      role TEXT DEFAULT 'user' CHECK (role IN ('user','admin')),
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );
  `);
}


async function populateRoles(db) {
  const email = process.env.ADMIN_SEED_EMAIL;
  const password = process.env.ADMIN_SEED_PASSWORD;

  if (!email || !password) {
    throw new Error("Admin seed credentials missing");
  }

  const hashedPassword = await argon2.hash(password);

  await db.run(
    `INSERT OR IGNORE INTO users (email, name, password_hash, role)
     VALUES (?, ?, ?, ?)`,
    [email, "Ghazal", hashedPassword, "admin"]
  );
}

export default async function handler(req, res) {
  if (process.env.NODE_ENV !== "development" || process.env.ALLOW_DB_SEED !== "true") {
    return res.status(403).json({ error: "Seeding disabled" });
  }  

  try {
    const db = await openDB();
    await createTables(db);
    await populateRoles(db);
    res.status(200).json({ message: "Database reset complete ✅" });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Database setup failed" });
  }
}





