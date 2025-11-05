// /lib/middleware/createAdminHandler.js
import nc from "next-connect";
import { authorizeAdmin } from "@/lib/auth/authorizeAdmin";
import { rateLimiter } from "@/lib/middleware/rateLimiter";
import { withRequestId } from "./requestId";

// Utility helpers
const isObj = (v) => v && typeof v === "object";
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : d;
};

/**
 * Graceful async wrapper for rateLimiter.
 * Prevents unhandled rejections and ensures next() always runs if possible.
 */
function wrapRateLimiter(rateLimiterFn, opts) {
  return async (req, res, next) => {
    try {
      let passed = false;
      await new Promise((resolve) => {
        rateLimiterFn(req, res, () => {
          passed = true;
          resolve();
        }, opts);
      });
      if (!res.headersSent && passed) return next();
      if (!res.headersSent) next();
    } catch (err) {
      console.error("[rateLimiter] ❌ Error:", err);
      if (!res.headersSent) {
        res.status(429).json({ success: false, error: "Rate limit exceeded or error" });
      }
    }
  };
}

/**
 * createAdminHandler()
 * Base wrapper for all admin API routes.
 * Provides: rate limit, requestId, logging, auth, safety guards, and fallbacks.
 */
export function createAdminHandler(options = {}) {
  const rawRL = isObj(options.rateLimit) ? options.rateLimit : {};
  const rateLimit = {
    limit: toInt(rawRL.limit, 60),
    window: toInt(rawRL.window, 60),
  };

  /* ──────────────── Error Handling ──────────────── */
  const onError =
    options.onError ||
    ((err, req, res) => {
      try {
        const status = Number(err?.statusCode ?? err?.status ?? 500) || 500;
        const message =
          typeof err?.message === "string" ? err.message : "Internal Server Error";

        console.error(
          `❌ [Admin API Error] (${req.method} ${req.url}):`,
          message,
          err?.stack || ""
        );

        if (!res.headersSent) {
          res.status(status).json({ success: false, error: message, code: status });
        }
      } catch (fallbackErr) {
        console.error("[Admin API Fallback Error] 💥", fallbackErr);
        if (!res.headersSent) res.status(500).json({ success: false, error: "Fatal middleware failure" });
      }
    });

  /* ──────────────── No-Match Handler ──────────────── */
  const onNoMatch =
    options.onNoMatch ||
    ((req, res) => {
      try {
        console.warn(`⚠️ [NO MATCH] ${req.method} ${req.url}`);
        if (!res.headersSent)
          res.status(405).json({ success: false, error: `Method ${req.method} not allowed` });
      } catch (err) {
        console.error("[NO MATCH] 💥 Unexpected error:", err);
      }
    });

  const handler = nc({ onError, onNoMatch });

  /* ──────────────── MIDDLEWARE CHAIN ──────────────── */

  // Request ID for traceability
  handler.use(withRequestId);

  // Logging — request start
  handler.use((req, _res, next) => {
    if (!req.url?.startsWith("/_next")) {
      console.log(`\n🔥 [Request Start] [${req.rid}] ${req.method} ${req.url}`);
    }
    next();
  });

  // OPTIONS preflight
  handler.use((req, res, next) => {
    try {
      if (req.method === "OPTIONS") {
        res.setHeader("Allow", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
        console.log(`[${req.rid}] 🕊 OPTIONS preflight → 204`);
        return res.status(204).end();
      }
      next();
    } catch (err) {
      console.error(`[${req.rid}] 💥 Error handling OPTIONS:`, err);
      if (!res.headersSent) res.status(500).json({ success: false, error: "Preflight handling failed" });
    }
  });

  // Security headers
  handler.use((req, res, next) => {
    try {
      res.setHeader("Cache-Control", "no-store");
      res.setHeader("Vary", "X-Requested-With");
      if (!res.getHeader("Content-Type")) {
        res.setHeader("Content-Type", "application/json; charset=utf-8");
      }
      next();
    } catch (err) {
      console.error(`[${req.rid}] 💥 Error setting security headers:`, err);
      next();
    }
  });

  // Rate limiter (skip GET)
  handler.use((req, res, next) => {
    try {
      if (req.method === "GET") {
        console.log(`[${req.rid}] ⏩ Skip rateLimiter for GET`);
        return next();
      }
      console.log(`[${req.rid}] 🧭 Applying rateLimiter for ${req.method}`);
      return wrapRateLimiter(rateLimiter, rateLimit)(req, res, next);
    } catch (err) {
      console.error(`[${req.rid}] 💥 Error applying rateLimiter:`, err);
      next();
    }
  });

  // Authorization guard
  // Authorization guard
  handler.use(async (req, res, next) => {
    console.log(`[${req.rid}] 🔐 Checking authorization...`);
    try {
      await authorizeAdmin()(req, res, next);
      if (!res.headersSent) console.log(`[${req.rid}] ✅ Authorized ADMIN`);
    } catch (err) {
      console.error(`[${req.rid}] 🚫 Authorization failed:`, err?.message || err);
      if (!res.headersSent)
        return res.status(401).json({ success: false, error: "Unauthorized" });
      // ❌ REMOVE THIS unsafe next() call
      // if (!res.headersSent && !res.writableEnded) next();
    }
  });


  // Universal Pass-through guard
  handler.use((req, res, next) => {
    if (res.headersSent || res.writableEnded) {
      console.log(`⛔ [Stop chain] Response already sent → ${req.method} ${req.url}`);
      return;
    }
    console.log(`🧩 [Middleware Pass] ${req.method} ${req.url}`);
    next();
  });

  // Handler confirmation check
  handler.use((req, res, next) => {
    if (res.headersSent || res.writableEnded) {
      console.log(`⛔ [Skip Handler Check] Response already ended`);
      return;
    }
    console.log(`🔥 [Handler Trigger Check] → ${req.method} ${req.url}`);
    next();
  });
   // ✅ Wire up route methods dynamically
  if (typeof options.get === "function") handler.get(options.get);
  if (typeof options.post === "function") handler.post(options.post);
  if (typeof options.put === "function") handler.put(options.put);
  if (typeof options.delete === "function") handler.delete(options.delete);


  /* ──────────────── Final Fallback (after routes) ──────────────── */
  handler.attachFallback = function () {
    handler.use((req, res) => {
      try {
        if (res.headersSent || res.writableEnded) return;
        console.warn(`🚨 [Final Fallback AFTER routes] → ${req.method} ${req.url}`);
        res.status(405).json({
          success: false,
          error: "No matching handler found",
        });
      } catch (err) {
        console.error("[Fallback] 💥 Fatal handler error:", err);
        if (!res.headersSent) res.status(500).json({ success: false, error: "Fallback error" });
      }
    });
    return handler;
  };

  return handler;
}





