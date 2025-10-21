// pages/api/admin/upload.js
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import { Readable } from "stream";
import { createAdminUploadHandler } from "@/lib/middleware/createAdminUploadHandler";

// ---- Cloudinary config (envs must be set in .env.local)
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
  secure:     true,
});

// ---- Multer: in-memory, with an upper bound to handle big videos too
const MAX_IMAGE_MB = 25;
const MAX_VIDEO_MB = 150;
const upload = multer({
  storage: multer.memoryStorage(),
  // set an upper bound large enough for videos; we’ll validate per type below
  limits: { fileSize: MAX_VIDEO_MB * 1024 * 1024 },
});

// ---- Small helpers
function ensureConfigured() {
  if (!process.env.CLOUDINARY_CLOUD_NAME ||
      !process.env.CLOUDINARY_API_KEY ||
      !process.env.CLOUDINARY_API_SECRET) {
    throw new Error("Cloudinary env vars are missing");
  }
}

// sanitize folder to avoid ../ etc. and prefix with a base
function safeFolder(input) {
  const base = process.env.CLOUDINARY_UPLOAD_FOLDER || "shell-stories/products";
  if (!input) return base;
  const cleaned = String(input).replace(/\.\./g, "").replace(/^\/+|\/+$/g, "");
  return `${base}/${cleaned}`;
}

// ---- Build the handler with your admin middleware
const handler = createAdminUploadHandler({ uploadMiddleware: upload.single("file") });

handler.post(async (req, res) => {
  try {
    ensureConfigured();
    console.log("🛬 Upload route hit");

    // 1) Validate presence
    if (!req.file) {
      console.error("❌ No file received");
      return res.status(400).json({ error: "No file uploaded" });
    }

    const { buffer, mimetype, size, originalname } = req.file;
    const isImage = mimetype?.startsWith("image/");
    const isVideo = mimetype?.startsWith("video/");

    // 2) Validate type
    if (!isImage && !isVideo) {
      return res.status(415).json({ error: "Unsupported file type. Only images/videos allowed." });
    }

    // 3) Validate size
    if (isImage && size > MAX_IMAGE_MB * 1024 * 1024) {
      return res.status(413).json({ error: `Image too large (max ${MAX_IMAGE_MB}MB)` });
    }
    if (isVideo && size > MAX_VIDEO_MB * 1024 * 1024) {
      return res.status(413).json({ error: `Video too large (max ${MAX_VIDEO_MB}MB)` });
    }

    // 4) Options
    const folder = safeFolder(req.query.folder || "admin/products");
    const productId = req.query.productId ? String(req.query.productId) : undefined;
    const tags =
      (req.body?.tags || "")
        .split(",")
        .map((t) => t.trim())
        .filter(Boolean);

    const uploadOptions = {
      folder,
      resource_type: isVideo ? "video" : "image", // "auto" also works
      use_filename: true,
      unique_filename: true,
      overwrite: false,
      tags,
      context: productId ? { product_id: productId } : undefined,
    };

    // Optional: eager conversion for videos (e.g. normalize to mp4)
    if (isVideo) {
      uploadOptions.eager = [{ format: "mp4" }];
      uploadOptions.eager_async = false;
    }

    // 5) Stream upload to Cloudinary
    const stream = cloudinary.uploader.upload_stream(uploadOptions, (error, result) => {
      if (error) {
        console.error("Cloudinary upload error:", error);
        return res.status(502).json({ error: error.message || "Upload failed" });
      }

      // return rich metadata your admin UI can persist to DB
      return res.status(200).json({
        url: result.secure_url,
        publicId: result.public_id,
        resourceType: result.resource_type, // "image" | "video"
        format: result.format,
        bytes: result.bytes,
        width: result.width,
        height: result.height,
        duration: result.duration ?? null,
        originalFilename: originalname,
        folder,
      });
    });

    Readable.from(buffer).pipe(stream);
  } catch (err) {
    console.error("Upload route failed:", err);
    res.status(500).json({ error: "Internal error" });
  }
});

export const config = {
  api: { bodyParser: false },
};

export default handler;


