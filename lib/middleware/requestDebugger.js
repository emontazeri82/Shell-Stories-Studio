// lib/middleware/requestDebugger.js
import { randomUUID } from "crypto";

function safeJson(value, max = 2048) {
  try {
    const s = JSON.stringify(value);
    return s.length > max ? s.slice(0, max) + "…(truncated)" : s;
  } catch {
    return "<unserializable>";
  }
}

/**
 * Use as the FIRST middleware in your handler pipeline.
 * Logs: start → end, status, ms, req id, method, path, query, body size/snippet
 */
export function requestDebugger(opts = {}) {
  const {
    logBodies = true,
    logHeaders = false,
    maxBody = 2048,
    sample = 1, // 1 = log all; 0.1 = 10% sampling
    label = "reqdbg",
  } = opts;

  return async function requestDebuggerMiddleware(req, res, next) {
    if (Math.random() > sample) return next?.();

    const id =
      req.rid ||
      (typeof randomUUID === "function" ? randomUUID() : Math.random().toString(36).slice(2));
    req.rid = id;

    const start = Date.now();
    const { method, url, query = {}, body } = req;

    // capture original res.end to know when the response finishes
    const _end = res.end;
    let bytesOut = 0;

    res.end = function patchedEnd(chunk, encoding, cb) {
      try {
        if (chunk) bytesOut += Buffer.byteLength(chunk, encoding || "utf8");
      } catch {}
      res.end = _end; // restore
      const ms = Date.now() - start;

      const lines = [
        `[${label}] END`,
        `rid=${id}`,
        `status=${res.statusCode}`,
        `ms=${ms}`,
        `bytes=${bytesOut}`,
      ];
      console.log(lines.join(" | "));
      return _end.call(this, chunk, encoding, cb);
    };

    // START log
    const lines = [
      `[${label}] START`,
      `rid=${id}`,
      `${method} ${url}`,
      `query=${safeJson(query, 512)}`,
    ];
    if (logBodies) lines.push(`body=${safeJson(body, maxBody)}`);
    if (logHeaders) lines.push(`headers=${safeJson(req.headers, 1024)}`);
    console.log(lines.join(" | "));

    return next?.();
  };
}
