// pages/api/admin/media/delete.js
import { createAdminHandler } from "@/lib/middleware/createAdminHandler";
import { query } from "@/lib/db";
import cloudinary from "@/lib/cloudinary";
import { sendErrorResponse, sendSuccessResponse } from "@/lib/api";

export default createAdminHandler({
  /**
   * Delete a media item (image or video) from Cloudinary + DB
   * --------------------------------------------------------
   * Expects: { public_id: "products/xxx/yyyy" }
   */
  async post(req, res) {
    const { public_id } = req.body;

    // ────────────────────────────────
    // 1️⃣ Validate input
    // ────────────────────────────────
    if (!public_id || typeof public_id !== "string") {
      return sendErrorResponse(res, 400, "Missing or invalid public_id");
    }
    // 0️⃣ Lookup product_id so we can resync main image
    const [prod] = await query(
      "SELECT product_id FROM product_media WHERE public_id = ?",
      [public_id]
    );

    const productId = prod?.product_id || null;


    try {
      console.log("[media/delete] 🧩 Request to delete:", public_id);

      // ────────────────────────────────
      // 2️⃣ Determine Cloudinary resource type
      // ────────────────────────────────
      let resourceType = "image"; // default

      try {
        const [row] = await query(
          "SELECT kind FROM product_media WHERE public_id = ?",
          [public_id]
        );
        if (row?.kind === "video") resourceType = "video";
      } catch (lookupErr) {
        console.warn(
          "[media/delete] ⚠️ Could not determine media kind, defaulting to 'image'"
        );
      }

      console.log(`[media/delete] ☁️ Deleting from Cloudinary as ${resourceType}`);

      // ────────────────────────────────
      // 3️⃣ Delete from Cloudinary
      // ────────────────────────────────
      const destroyResult = await cloudinary.uploader.destroy(public_id, {
        resource_type: resourceType,
      });

      console.log("[media/delete] ☁️ Cloudinary destroy result:", destroyResult);

      if (
        destroyResult.result !== "ok" &&
        destroyResult.result !== "not found"
      ) {
        console.warn(
          "[media/delete] ⚠️ Unexpected Cloudinary response:",
          destroyResult
        );
      }

      // ────────────────────────────────
      // 4️⃣ Delete from local database
      // ────────────────────────────────
      const dbResult = await query(
        "DELETE FROM product_media WHERE public_id = ?",
        [public_id]
      );

      console.log("[media/delete] 🗑️ DB deletion result:", dbResult);

      // 🔄 5️⃣ Sync primary image if this media belonged to a product
      if (productId) {
        try {
          const { syncPrimaryImage } = await import("@/lib/productMediaUtils");
          await syncPrimaryImage(productId);
          console.log(`[media/delete] 🔄 Primary image resynced for product ${productId}`);
        } catch (syncErr) {
          console.error("[media/delete] ❌ Failed to sync primary image:", syncErr);
        }
      }

      // ────────────────────────────────
      // 5️⃣ Return success response
      // ────────────────────────────────
      return sendSuccessResponse(res, 200, "Media deleted successfully", {
        deleted: dbResult.changes || 0,
        public_id,
        cloudinary_result: destroyResult.result,
      });
    } catch (err) {
      console.error("[media/delete] ❌ Error deleting media:", err);
      return sendErrorResponse(
        res,
        500,
        "Failed to delete media",
        err.message || err
      );
    }
  },
});
