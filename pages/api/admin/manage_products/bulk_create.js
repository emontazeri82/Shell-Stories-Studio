// pages/api/admin/manage_products/bulk_create.js
import { openDB } from '@/lib/db';
import { sendErrorResponse, sendSuccessResponse, validateProductData } from '@/lib/api';
import { sanitizeProductFields } from '@/lib/utils/sanitizeProductFields';
import { createAdminHandler } from '@/lib/middleware/createAdminHandler';

const handler = createAdminHandler({
  rateLimit: { limit: 60, window: 60 }, // optional, tweak as needed
});

// 🔄 Bulk create products
handler.post(async (req, res) => {
  const products = req.body;

  if (!Array.isArray(products)) {
    return sendErrorResponse(res, 400, 'Invalid input: expected an array of products');
  }

  const db = await openDB();
  try {
    await db.exec('BEGIN');

    const stmt = await db.prepare(
      `INSERT INTO products (
        name, description, price, stock, 
        image_url, image_public_id, category, 
        is_active, is_favorite
      )  VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    );

    for (const rawProduct of products) {
      const sanitized = sanitizeProductFields(rawProduct);
      const validationError = validateProductData(sanitized);
      if (validationError) {
        await db.exec('ROLLBACK');
        return sendErrorResponse(res, 400, `Validation failed: ${validationError}`);
      }

      await stmt.run(
        sanitized.name,
        sanitized.description,
        sanitized.price,
        sanitized.stock,
        sanitized.image_url,
        sanitized.image_public_id,
        sanitized.category,
        sanitized.is_active,
        sanitized.is_favorite
      );
    }
    await stmt.finalize();
    await db.exec('COMMIT');
    sendSuccessResponse(res, 200, 'Products added successfully');
  } catch (err) {
    console.error('❌ Bulk insert failed:', err);
    await db.exec('ROLLBACK');
    sendErrorResponse(res, 500, 'Failed to add products');
  }
});

export default handler;



