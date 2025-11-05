// /lib/redis/formatKey.js

/**
 * Safely formats an array (or string) into a sanitized Redis key.
 * Removes unsafe characters, trims, limits length per segment,
 * and gracefully handles bad input.
 *
 * @param {string[]|string} parts - Key segments or a single string
 * @param {object} [opts]
 * @param {boolean} [opts.debug=false] - If true, logs the final key
 * @returns {string} Safe Redis key (never empty)
 */
export function safeRedisKey(parts = [], opts = {}) {
  try {
    const { debug = false } = opts;

    // Normalize: allow single string
    if (typeof parts === 'string') parts = [parts];
    if (!Array.isArray(parts)) {
      console.warn('[safeRedisKey] ⚠️ Invalid input type:', typeof parts);
      parts = ['invalid'];
    }

    const cleaned = parts
      .map((p) =>
        String(p || '')
          .trim()
          .replace(/[^a-zA-Z0-9:_-]/g, '') // remove unsafe chars
          .slice(0, 64)
      )
      .filter(Boolean);

    const key = cleaned.join(':') || 'unknown:key';

    if (debug) console.log('[safeRedisKey] 🔑 Generated key:', key);
    return key;
  } catch (err) {
    console.error('[safeRedisKey] 💥 Failed to format key:', err);
    return 'error:key';
  }
}
