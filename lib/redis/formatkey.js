// lib/redis/formatKey.js

/**
 * Safely formats an array of strings or values into a sanitized Redis key.
 * It removes dangerous characters and limits each segment to 64 characters.
 * @param {string[]} parts - Array of key segments
 * @returns {string} - Safe Redis key
 */
export function safeRedisKey(parts = []) {
    return parts
      .map(p =>
        String(p || '')
          .trim()
          .replace(/[^a-zA-Z0-9:_-]/g, '') // remove unsafe characters
          .slice(0, 64)                    // limit each part
      )
      .join(':');
  }
  
  