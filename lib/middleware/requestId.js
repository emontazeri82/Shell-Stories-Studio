// lib/middleware/requestId.js
export function withRequestId(req, res, next) {
    // Node 18+: crypto.randomUUID(); fallback if unavailable
    const rid = (typeof crypto?.randomUUID === 'function')
      ? crypto.randomUUID()
      : `${Date.now().toString(36)}-${Math.random().toString(16).slice(2, 10)}`;
  
    req.rid = rid;
    res.setHeader('X-Request-Id', rid);
    next();
  }
  