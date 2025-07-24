// pages/api/admin/manage_products/bulk_create.js
import { openDB } from '../../../lib/db';

export default async function handler(req, res) {
  if (req.method === 'POST') {
    const products = req.body; // Expecting an array of products

    const db = await openDB();
    try {
      // Start a transaction to perform bulk insert
      await db.exec('BEGIN');

      const stmt = await db.prepare(
        `INSERT INTO products (name, description, price, stock, image_url, category, is_active)
         VALUES (?, ?, ?, ?, ?, ?, ?)`
      );

      // Insert all products in a loop
      for (const product of products) {
        await stmt.run(
          product.name, product.description, product.price, product.stock, product.image_url, product.category, product.isActive
        );
      }

      // Commit the transaction
      await db.exec('COMMIT');
      res.status(200).json({ message: 'Products added successfully' });
    } catch (err) {
      console.error(err);
      await db.exec('ROLLBACK');
      res.status(500).json({ error: 'Failed to add products' });
    }
  } else {
    res.status(405).json({ error: 'Method Not Allowed' });
  }
}
