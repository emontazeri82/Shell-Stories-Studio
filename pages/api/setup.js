// pages/api/setup.js
const sqlite3 = require('sqlite3');
const { open } = require('sqlite');
const path = require('path');

const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');

async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

async function createTables(db) {
  await db.exec(`
    CREATE TABLE IF NOT EXISTS products (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL UNIQUE,
      description TEXT,
      price REAL NOT NULL CHECK (price >= 0),
      stock INTEGER NOT NULL CHECK (stock >= 0),
      image_url TEXT,
      category TEXT DEFAULT 'decor',
      is_active INTEGER DEFAULT 1 CHECK (is_active IN (0, 1))
    );

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
      session_id TEXT,
      paypal_order_id TEXT,
      email TEXT,
      customer_name TEXT,
      phone TEXT,
      total_price REAL NOT NULL,
      payment_status TEXT DEFAULT 'Pending',
      shipping_address TEXT NOT NULL,
      billing_address TEXT NOT NULL,
      payment_method TEXT DEFAULT 'Card',
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
  `);
}

async function populateProducts(db) {
  try {
    await db.exec(`
      INSERT INTO products (name, description, price, stock, image_url, category, is_active) VALUES
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
  try {
    const db = await openDB();
    await createTables(db);
    await populateProducts(db);
    res.status(200).json({ message: 'Database setup complete' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: 'Database setup failed' });
  }
}


