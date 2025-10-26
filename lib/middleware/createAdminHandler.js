// /lib/middleware/createAdminHandler.js
import nc from "next-connect";
import { authorizeAdmin } from "@/lib/auth/authorizeAdmin";
import { rateLimiter } from "@/lib/middleware/rateLimiter";
import { withRequestId } from "./requestId";

const isObj = (v) => v && typeof v === "object";
const toInt = (v, d) => {
  const n = Number(v);
  return Number.isFinite(n) && n >= 0 ? Math.trunc(n) : d;
};

// Graceful async wrapper for rateLimiter
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
    } catch (e) {
      console.error("[rateLimiter] 💥 Error:", e);
      if (!res.headersSent)
        res.status(429).json({ error: "Rate limit exceeded or error" });
    }
  };
}

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
      const status = Number(err?.statusCode ?? err?.status ?? 500) || 500;
      const message =
        typeof err?.message === "string"
          ? err.message
          : "Internal Server Error";
      console.error(`❌ [Admin API Error] (${req.method} ${req.url}):`, message);
      if (!res.headersSent)
        res.status(status).json({ success: false, error: message, code: status });
    });

  /* ──────────────── Fallback for unmatched methods ──────────────── */
  const onNoMatch =
    options.onNoMatch ||
    ((req, res) => {
      console.warn(`⚠️ [NO MATCH] ${req.method} ${req.url}`);
      res
        .status(405)
        .json({ success: false, error: `Method ${req.method} not allowed` });
    });

  const handler = nc({ onError, onNoMatch });

  /* ──────────────── Add middlewares ──────────────── */
  handler.use(withRequestId);

  // Development request logger
  handler.use((req, _res, next) => {
    if (!req.url?.startsWith("/_next")) {
      console.log(`\n🔥 [Request Start] [${req.rid}] ${req.method} ${req.url}`);
    }
    next();
  });

  // OPTIONS preflight
  handler.use((req, res, next) => {
    if (req.method === "OPTIONS") {
      res.setHeader("Allow", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
      console.log(`[${req.rid}] 🕊 OPTIONS preflight → 204`);
      return res.status(204).end();
    }
    next();
  });

  // Security headers
  handler.use((req, res, next) => {
    res.setHeader("Cache-Control", "no-store");
    res.setHeader("Vary", "X-Requested-With");
    if (!res.getHeader("Content-Type")) {
      res.setHeader("Content-Type", "application/json; charset=utf-8");
    }
    next();
  });

  // Rate limiter
  handler.use((req, res, next) => {
    if (req.method === "GET") {
      console.log(`[${req.rid}] ⏩ Skip rateLimiter for GET`);
      return next();
    }
    console.log(`[${req.rid}] 🧭 Applying rateLimiter for ${req.method}`);
    return wrapRateLimiter(rateLimiter, rateLimit)(req, res, next);
  });

  // Authorization guard
  handler.use(async (req, res, next) => {
    console.log(`[${req.rid}] 🔐 Checking authorization...`);
    try {
      await authorizeAdmin()(req, res, next);
      console.log(`[${req.rid}] ✅ Authorized ADMIN`);
    } catch (err) {
      console.error(`[${req.rid}] 🚫 Authorization failed:`, err?.message || err);
      if (!res.headersSent)
        return res.status(401).json({ success: false, error: "Unauthorized" });
    } finally {
      // Always move on if response still open
      if (!res.writableEnded) next();
    }
  });

  /* ──────────────── Universal Pass-through ──────────────── */
  handler.use((req, res, next) => {
    // ✅ Fix 1: Stop chain after response already sent
    if (res.headersSent || res.writableEnded) {
      console.log(`⛔ [Stop chain] Response already sent → ${req.method} ${req.url}`);
      return;
    }
    console.log(`🧩 [Middleware Pass] ${req.method} ${req.url}`);
    next();
  });

  /* ──────────────── Handler confirmation ──────────────── */
  handler.use((req, res, next) => {
    // ✅ Fix 2: Avoid calling next() if response closed
    if (res.headersSent || res.writableEnded) {
      console.log(`⛔ [Skip Handler Check] Response already ended`);
      return;
    }
    console.log(`🔥 [Handler Trigger Check] → ${req.method} ${req.url}`);
    next();
  });

  /* ──────────────── Final fallback (after all handlers) ──────────────── */
  // 🧱 Export with a built-in helper that only attaches fallback *after* routes
  // ✅ Attach fallback manually after routes
  handler.attachFallback = function () {
    handler.use((req, res) => {
      if (res.headersSent || res.writableEnded) return;
      console.warn(`🚨 [Final Fallback AFTER routes] → ${req.method} ${req.url}`);
      res.status(405).json({
        success: false,
        error: "No matching handler found",
      });
      return; // ✅ ensure no further middleware fires
    });
    return handler;
  };


  return handler;
}





