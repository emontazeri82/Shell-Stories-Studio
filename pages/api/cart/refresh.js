// pages/api/cart/refresh.js
import { getDb } from "@/lib/db/sqlite";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ error: "Method not allowed" });
  }

  try {
    const { items } = req.body;

    if (!Array.isArray(items)) {
      return res.status(400).json({ error: "Invalid items payload" });
    }

    const db = await getDb();
    const updated = [];

    for (const item of items) {
      if (!item?.id) continue;

      const product = await db.get(
        `SELECT id, name, price, stock, is_active, image_url, description
         FROM products
         WHERE id = ?`,
        [item.id]
      );

      if (!product || product.is_active !== 1) {
        updated.push({
          ...item,
          valid: false,
          reason: "Product no longer available",
        });
        continue;
      }

      let quantity = item.quantity;
      if (quantity > product.stock) quantity = product.stock;

      // merge all fields needed by frontend
      updated.push({
        id: product.id,
        name: product.name,
        price: Number(product.price),
        quantity,
        stock: product.stock,
        image_url: product.image_url,      // 🔥 must include
        description: product.description,  // 🔥 must include
        valid: quantity > 0,
        reason: quantity > 0 ? null : "Out of stock",
      });
    }

    return res.status(200).json({ updated });
  } catch (err) {
    console.error("❌ cart/refresh error:", err);
    return res.status(500).json({ error: "Server error" });
  }
}
