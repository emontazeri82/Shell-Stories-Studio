// ✅ /lib/cloudinaryCleanup.js
import { v2 as cloudinary } from "cloudinary";

// 🧩 Make sure Cloudinary is configured from environment variables
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

/**
 * 🧹 Delete Cloudinary assets linked to a product
 * @param {string|string[]} publicIds - One or multiple Cloudinary public IDs
 * @param {'image'|'video'} [resourceType='image']
 */
export async function deleteCloudinaryAssets(publicIds, resourceType = "image") {
  if (!publicIds || (Array.isArray(publicIds) && publicIds.length === 0)) {
    console.warn("[CloudinaryCleanup] ⚠️ No public IDs provided for deletion.");
    return;
  }

  const ids = Array.isArray(publicIds) ? publicIds : [publicIds];

  try {
    console.log(`[CloudinaryCleanup] 🧹 Deleting ${ids.length} ${resourceType}(s):`, ids);

    const result = await cloudinary.api.delete_resources(ids, {
      resource_type: resourceType,
    });

    console.log("[CloudinaryCleanup] ✅ Deletion result:", result);
    return result;
  } catch (err) {
    console.error("[CloudinaryCleanup] ❌ Error deleting Cloudinary assets:", err);
    throw err;
  }
}

/**
 * 🗂️ Optional: Delete an entire Cloudinary folder (e.g., product folder)
 * @param {string} folderPath - Cloudinary folder name
 */
export async function deleteCloudinaryFolder(folderPath) {
  try {
    console.log(`[CloudinaryCleanup] 📁 Deleting folder: ${folderPath}`);
    const result = await cloudinary.api.delete_folder(folderPath);
    console.log("[CloudinaryCleanup] ✅ Folder deleted:", result);
    return result;
  } catch (err) {
    console.error("[CloudinaryCleanup] ❌ Error deleting folder:", err);
    throw err;
  }
}
