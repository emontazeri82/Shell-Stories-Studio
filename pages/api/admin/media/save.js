// /pages/api/admin/media/save.js
import path from "path";
import sqlite3 from "sqlite3";
import { open } from "sqlite";
import { createAdminUploadHandler } from "@/lib/middleware/createAdminUploadHandler";
import { requestDebugger } from "@/lib/middleware/requestDebugger";

const handler = createAdminUploadHandler();
console.log("[DEBUG] createAdminUploadHandler initialized at", new Date().toISOString());

handler.use(requestDebugger({ logBodies: true, maxBody: 4000 }));

const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
async function openDB() {
  return open({ filename: dbPath, driver: sqlite3.Database });
}

// ✅ Keep bodyParser true for JSON requests (even if middleware disables it)
export const config = {
  api: {
    bodyParser: { sizeLimit: "10mb" },
  },
};

handler.post(async (req, res) => {
  console.log("🔥 [media/save] Handler triggered!");
  console.log("🧠 productId (query):", req.query.productId);
  console.log("🧪 typeof req.body BEFORE parsing:", typeof req.body);
  console.log(
    "[DEBUG] handler stack:",
    Object.keys(handler)
  );


  try {
    // ✅ 1️⃣ Always ensure JSON-parsed body
    let body = req.body;
    if (!body) {
      console.warn("⚠️ req.body is empty! Trying to read raw text stream…");
      let raw = "";
      for await (const chunk of req) raw += chunk;
      body = raw;
    }

    if (typeof body === "string") {
      try {
        body = JSON.parse(body);
      } catch (err) {
        console.error("❌ Failed to parse JSON body:", err.message);
        return res.status(400).json({ success: false, message: "Invalid JSON body" });
      }
    }

    // ✅ 2️⃣ Extract productId + media array
    const productId = Number(req.query.productId ?? body.product_id ?? body.productId);
    const mediaArray = Array.isArray(body?.media) ? body.media : [];

    console.log("🧠 Parsed productId:", productId);
    console.log("🧠 Parsed media array length:", mediaArray.length);

    if (!productId || mediaArray.length === 0) {
      console.warn("⚠️ Invalid payload — missing productId or media array");
      return res.status(400).json({
        success: false,
        message: "Invalid payload: missing productId or media array",
        received: { productId, mediaArray },
      });
    }

    // ✅ 3️⃣ Save media to DB
    const db = await openDB();
    const insertStmt = await db.prepare(`
      INSERT INTO product_media 
      (product_id, kind, public_id, secure_url, format, width, height, duration, alt, sort_order, is_primary)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    let inserted = 0;
    for (const item of mediaArray) {
      const url = item.url || item.secure_url;
      const publicId = item.publicId || item.public_id;
      const resourceType = item.resourceType || item.kind || "image";

      if (!url || !publicId) {
        console.warn("⚠️ Skipping incomplete record:", item);
        continue;
      }
      // 🛑 Prevent duplicate entries for the same product + public_id
      const exists = await db.get(
        "SELECT id FROM product_media WHERE product_id = ? AND public_id = ?",
        [productId, publicId]
      );

      if (exists) {
        console.warn(`⚠️ Skipping duplicate media for product ${productId}: ${publicId}`);
        continue;
      }

      await insertStmt.run([
        productId,
        resourceType,
        publicId,
        url,
        item.format,
        item.width || null,
        item.height || null,
        item.duration || null,
        item.originalFilename || null,
        item.sort_order || 0,
        item.is_primary ? 1 : 0,
      ]);

      inserted++;
    }


    await insertStmt.finalize();
    console.log(`✅ Saved ${inserted} media entries for product ${productId}`);

    // ✅ 4️⃣ Confirm completion
    return res.status(200).json({
      success: true,
      message: "Media saved successfully",
      count: inserted,
      media: mediaArray,
    });

  } catch (err) {
    console.error("💥 Error in /api/admin/media/save:", err);
    return res.status(500).json({ success: false, message: err.message || "Internal server error" });
  }
});
console.log("[DEBUG] Registered routes:", handler.router?.stack?.map(r => r.route?.path || r.name));

export default handler;










