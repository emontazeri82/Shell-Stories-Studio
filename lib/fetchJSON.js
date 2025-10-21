// Minimal JSON fetch helper (JSON-only in/out, clear errors)
export default async function fetchJSON(url, options = {}) {
    const res = await fetch(url, {
      ...options,
      headers: { Accept: 'application/json', ...(options.headers || {}) },
      credentials: 'same-origin',
    });
  
    const ct = res.headers.get('content-type') || '';
    const text = await res.text();
  
    if (!res.ok) {
      try {
        const data = JSON.parse(text);
        const msg = data?.error || data?.message || `HTTP ${res.status}`;
        throw new Error(msg);
      } catch {
        throw new Error(text.slice(0, 180) || `HTTP ${res.status}`);
      }
    }
  
    if (!ct.includes('application/json')) {
      throw new Error(`Expected JSON but got ${ct}`);
    }
  
    try {
      return JSON.parse(text);
    } catch (e) {
      throw new Error(`Invalid JSON: ${e.message}`);
    }
  }
  