import sqlite3 from "sqlite3";
import { open } from "sqlite";

export async function openDB() {
  const db = await open({
    filename: process.cwd() + "/data/shells_shop.db",
    driver: sqlite3.Database,
  });
  await db.exec("PRAGMA foreign_keys = ON");
  return db;
}

/** safely updates the product.image_url using the first image in product_media */
export async function syncPrimaryImage(productId) {
  const db = await openDB();

  // 1️⃣ get first image from product_media (in sort_order)
  const media = await db.get(
    `SELECT secure_url FROM product_media
     WHERE product_id = ?
     AND kind = 'image'
     ORDER BY is_primary DESC, sort_order ASC, id ASC
     LIMIT 1`,
    [productId]
  );

  if (!media) {
    console.warn(`⚠️ No media found for product ${productId}`);
    return;
  }

  // 2️⃣ update product.image_url
  await db.run(
    `UPDATE products
     SET image_url = ?
     WHERE id = ?`,
    [media.secure_url, productId]
  );

  console.log(`✅ Synced main image for product ${productId}`);
}
