// /lib/middleware/requestId.js
import crypto from "crypto";

/**
 * Middleware that assigns a unique Request ID (rid)
 * to every incoming request for tracing and debugging.
 */
export function withRequestId(req, res, next) {
  try {
    const rid =
      typeof crypto?.randomUUID === "function"
        ? crypto.randomUUID()
        : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;

    req.rid = rid;

    // Only set header if not already sent
    if (!res.headersSent) {
      res.setHeader("X-Request-Id", rid);
    }

    console.log(`[withRequestId] 🪪 Assigned rid=${rid}`);
  } catch (err) {
    console.warn("[withRequestId] ⚠️ Failed to generate request ID:", err);
  } finally {
    next();
  }
}
