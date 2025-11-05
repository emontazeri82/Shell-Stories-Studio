// /lib/middleware/createAdminUploadHandler.js
import nc from "next-connect";
import { authorizeAdmin } from "@/lib/auth/authorizeAdmin";
import { rateLimiter } from "@/lib/middleware/rateLimiter";

/**
 * createAdminUploadHandler
 * Secure upload handler for admin-only routes.
 * Includes: rate limiting, admin auth, safe error handling, and detailed debug logs.
 */
export function createAdminUploadHandler({ uploadMiddleware, ...options } = {}) {
  const {
    rateLimit = { limit: 30, window: 60 }, // stricter for uploads
    onError = (err, req, res) => {
      try {
        console.error("❌ [UploadHandler] Error:", err);
        const status = Number(err?.statusCode ?? err?.status ?? 500) || 500;
        const message =
          typeof err?.message === "string" ? err.message : "Internal Server Error";

        if (!res.headersSent) {
          res.status(status).json({
            success: false,
            error: message,
            code: status,
          });
        }
      } catch (fatalErr) {
        console.error("[UploadHandler] 💥 FATAL during error handling:", fatalErr);
        if (!res.headersSent) res.status(500).json({ success: false, error: "Upload middleware failed" });
      }
    },
    onNoMatch = (req, res) => {
      try {
        console.warn(`⚠️ [UploadHandler] No match: ${req.method} ${req.url}`);
        if (!res.headersSent)
          res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
      } catch (err) {
        console.error("[UploadHandler] 💥 Error in onNoMatch:", err);
      }
    },
  } = options;

  const handler = nc({ onError, onNoMatch });

  /* ──────────────── Middleware chain ──────────────── */

  // Rate limiter — applies before authentication
  handler.use(async (req, res, next) => {
    try {
      console.log(`🧭 [UploadHandler] Applying rateLimiter (${rateLimit.limit}/${rateLimit.window}s)`);
      await new Promise((resolve) => {
        rateLimiter(req, res, resolve, rateLimit);
      });
      next();
    } catch (err) {
      console.error("❌ [UploadHandler] Rate limiter failed:", err);
      if (!res.headersSent)
        res.status(429).json({ success: false, error: "Rate limit exceeded or error" });
    }
  });

  // Authorization — ensures only ADMIN users can proceed
  handler.use(async (req, res, next) => {
    console.log("🔐 [UploadHandler] Checking admin authorization...");
    try {
      await authorizeAdmin()(req, res, next);
      console.log("✅ [UploadHandler] Authorized ADMIN");
    } catch (err) {
      console.error("🚫 [UploadHandler] Authorization failed:", err?.message || err);
      if (!res.headersSent)
        res.status(401).json({ success: false, error: "Unauthorized" });
      return;
    } 
});

// Attach upload middleware (e.g., Multer) — only if admin authorized
if (uploadMiddleware) {
  handler.use((req, res, next) => {
    try {
      console.log("📦 [UploadHandler] Starting upload middleware...");
      uploadMiddleware(req, res, (err) => {
        if (err) {
          console.error("❌ [UploadHandler] Upload middleware error:", err);
          if (!res.headersSent)
            return res.status(400).json({ success: false, error: err.message || "Upload failed" });
        } else {
          console.log("✅ [UploadHandler] Upload middleware completed successfully");
          next();
        }
      });
    } catch (err) {
      console.error("💥 [UploadHandler] Fatal upload handler exception:", err);
      if (!res.headersSent)
        res.status(500).json({ success: false, error: "Internal upload handler error" });
    }
  });
} else {
  console.warn("⚠️ [UploadHandler] No uploadMiddleware provided — skipping file upload handling");
}

// Final safeguard for unexpected errors after middleware chain
handler.use((req, res, next) => {
  try {
    if (res.headersSent || res.writableEnded) {
      console.log("⛔ [UploadHandler] Response already sent — stop chain");
      return;
    }
    console.log("🧩 [UploadHandler] Middleware pass-through");
    next();
  } catch (err) {
    console.error("💥 [UploadHandler] Error in final guard:", err);
    if (!res.headersSent)
      res.status(500).json({ success: false, error: "Unexpected middleware error" });
  }
});

return handler;
}
