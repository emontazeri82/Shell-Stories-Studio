// /lib/middleware/requestDebugger.js
import { randomUUID } from "crypto";

export function requestDebugger(opts = {}) {
  const { label = "reqdbg", logBodies = true, maxBody = 1000 } = opts;

  return async function safeRequestDebugger(req, res, next) {
    try {
      if (process.env.NODE_ENV === "production") return next?.();

      req.rid = req.rid || randomUUID();
      const start = Date.now();

      // Log the request start
      console.log(`\n[${label}] ▶ START [${req.rid}] ${req.method} ${req.url}`);

      if (logBodies && req.body) {
        try {
          const bodyStr = JSON.stringify(req.body);
          console.log(`[${label}] body=`, bodyStr.length > maxBody ? bodyStr.slice(0, maxBody) + "…(truncated)" : bodyStr);
        } catch {
          console.log(`[${label}] body=<unserializable>`);
        }
      }

      // Wrap response to detect completion
      const _end = res.end;
      res.end = function patchedEnd(chunk, encoding, cb) {
        const ms = Date.now() - start;
        console.log(`[${label}] 🏁 END [${req.rid}] ${res.statusCode} in ${ms}ms`);
        res.end = _end;
        return _end.call(this, chunk, encoding, cb);
      };
    } catch (err) {
      console.warn(`[${label}] ⚠️ Debugger failed but ignored:`, err.message);
    } finally {
      return next?.();
    }
  };
}
