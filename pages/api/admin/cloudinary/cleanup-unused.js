// /pages/api/admin/cloudinary/cleanup-unused.js
import { createAdminHandler } from "@/lib/middleware/createAdminHandler";
import { openDB } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { deleteCloudinaryAssets } from "@/lib/cloudinaryCleanup";

const handler = createAdminHandler();

handler.post(async (req, res) => {
  const dryRun = req.body?.dryRun !== false;

  const db = await openDB();

  /* 1️⃣ Collect all USED public_ids from DB */
  const used = new Set();

  const productImages = await db.all(`
    SELECT image_public_id FROM products
    WHERE image_public_id IS NOT NULL
  `);

  const mediaImages = await db.all(`
    SELECT public_id FROM product_media
    WHERE public_id IS NOT NULL
  `);

  productImages.forEach(r => used.add(r.image_public_id));
  mediaImages.forEach(r => used.add(r.public_id));

  /* 2️⃣ List Cloudinary images (paginated) */
  let cursor;
  const unused = [];

  do {
    const result = await cloudinary.api.resources({
      type: "upload",
      resource_type: "image",
      prefix: "products/",
      max_results: 500,
      next_cursor: cursor,
    });

    for (const img of result.resources) {
      if (!used.has(img.public_id)) {
        unused.push(img.public_id);
      }
    }

    cursor = result.next_cursor;
  } while (cursor);

  /* 3️⃣ Dry run = show only */
  if (dryRun) {
    return res.json({
      dryRun: true,
      unusedCount: unused.length,
      sample: unused.slice(0, 10),
    });
  }

  /* 4️⃣ Confirmed delete */
  const result = await deleteCloudinaryAssets(unused, "image");

  return res.json({
    deletedCount: unused.length,
    result,
  });
});

export default handler;
