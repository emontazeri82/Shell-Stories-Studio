// lib/cloudinaryCleanup.js
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const MAX_BATCH = 100;

/**
 * 🧹 Delete Cloudinary assets in safe batches
 */
export async function deleteCloudinaryAssets(publicIds, resourceType = "image") {
  if (!publicIds || publicIds.length === 0) {
    console.warn("[CloudinaryCleanup] No public IDs provided.");
    return { deleted: {} };
  }

  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];
  const batches = [];

  for (let i = 0; i < ids.length; i += MAX_BATCH) {
    batches.push(ids.slice(i, i + MAX_BATCH));
  }

  const results = [];

  for (const batch of batches) {
    try {
      console.log(
        `[CloudinaryCleanup] Deleting ${batch.length} ${resourceType}(s)`
      );

      const res = await cloudinary.api.delete_resources(batch, {
        resource_type: resourceType,
        invalidate: true,
      });

      results.push(res);
    } catch (err) {
      console.error(
        `[CloudinaryCleanup] Failed batch (${resourceType}):`,
        err?.error || err
      );
      throw err;
    }
  }

  return {
    totalRequested: ids.length,
    batches: batches.length,
    results,
  };
}


/* ──────────────────────────────────────────────
   🗂️ Delete a folder (must be empty!)
────────────────────────────────────────────── */
/**
 * Delete an empty Cloudinary folder
 * @param {string} folderPath
 */
export async function deleteCloudinaryFolder(folderPath) {
  if (!folderPath) {
    throw new Error("Folder path required");
  }

  try {
    return await cloudinary.api.delete_folder(folderPath);
  } catch (err) {
    console.error("[CloudinaryCleanup] ❌ Folder delete failed:", err);
    throw err;
  }
}
