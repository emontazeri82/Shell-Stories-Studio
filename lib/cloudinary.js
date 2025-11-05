import { v2 as cloudinary } from "cloudinary";
import { createHash } from "crypto";

if (typeof window !== "undefined") {
  throw new Error("[Cloudinary] Client access denied");
}

// Sanity check + anonymized logging
function verifyEnv(varName) {
  const value = process.env[varName];
  if (!value) throw new Error(`Missing env var: ${varName}`);
  // Log hashed identifier instead of raw key for security
  console.log(`[Cloudinary] ${varName} → hash:${createHash("md5").update(value).digest("hex").slice(0, 6)}`);
  return value;
}

cloudinary.config({
  cloud_name: verifyEnv("CLOUDINARY_CLOUD_NAME"),
  api_key: verifyEnv("CLOUDINARY_API_KEY"),
  api_secret: verifyEnv("CLOUDINARY_API_SECRET"),
  secure: true,
});

export const destroyCloudinaryAsset = async (publicId) => {
  try {
    const result = await cloudinary.uploader.destroy(publicId, { resource_type: "auto" });
    console.log(`[Cloudinary] Deleted ${publicId} →`, result);
    return result;
  } catch (err) {
    console.error(`[Cloudinary] ❌ Failed to delete ${publicId}:`, err.message);
    throw err;
  }
};

export default cloudinary;
