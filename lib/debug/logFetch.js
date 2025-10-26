// lib/debug/logFetch.js
export async function logFetch(input, init = {}) {
    const t0 = performance.now();
    try {
      const res = await fetch(input, init);
      const ms = (performance.now() - t0).toFixed(0);
      console.log(`[fetch] ${init.method || "GET"} ${input} → ${res.status} in ${ms}ms`);
      return res;
    } catch (e) {
      const ms = (performance.now() - t0).toFixed(0);
      console.error(`[fetch] ${init.method || "GET"} ${input} ✖ in ${ms}ms:`, e.message);
      throw e;
    }
  }
  