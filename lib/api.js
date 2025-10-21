// lib/api.js

/** ---------------------------
 * Small, reuseable utilities
 * --------------------------*/
const isFiniteNumber = (v) => typeof v === 'number' && Number.isFinite(v);
const isHttpUrl = (s) => {
  if (typeof s !== 'string' || s.trim() === '') return false;
  try {
    const u = new URL(s);
    return u.protocol === 'http:' || u.protocol === 'https:';
  } catch {
    return false;
  }
};

/** -------------------------------------------------------
 * Standardized JSON responses (never leak HTML to clients)
 * ------------------------------------------------------*/
export const sendSuccessResponse = (res, statusCode, message, data = {}) => {
  // Ensure we always spread a plain object (avoid null/array surprises)
  const payload = (data && typeof data === 'object' && !Array.isArray(data)) ? data : {};
  res.status(statusCode).json({
    success: true,
    message,
    ...payload,
  });
};

export const sendErrorResponse = (res, statusCode, message, error = null) => {
  // Normalize non-serializable errors
  let errOut = error;
  if (error instanceof Error) {
    errOut = { name: error.name, message: error.message, stack: process.env.NODE_ENV === 'development' ? error.stack : undefined };
  } else if (error && typeof error === 'object') {
    try { JSON.stringify(error); } catch { errOut = String(error); }
  }
  res.status(statusCode).json({
    success: false,
    message,
    error: errOut,
  });
};

/** -------------------------------------------------------
 * Product payload validation (partial-safe, used for PATCH)
 * Pass only fields you intend to change.
 * Returns `null` when valid, or a string message on error.
 * ------------------------------------------------------*/
export const validateProductData = (data) => {
  // Guard against non-objects
  if (!data || typeof data !== 'object') return 'Payload must be an object';

  const {
    name,
    description,
    price,
    stock,
    image_url,
    category,
    is_active,
    is_favorite,
  } = data;

  // name: optional, if present must be non-empty <= 100
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return 'Name must be a non-empty string';
    }
    if (name.length > 100) return 'Name is too long (max 100 chars)';
  }

  // description: optional string <= 1000
  if (description !== undefined) {
    if (typeof description !== 'string') return 'Description must be a string';
    if (description.length > 1000) return 'Description is too long (max 1000 chars)';
  }

  // price: number > 0
  if (price !== undefined) {
    if (!isFiniteNumber(price) || price <= 0) return 'Price must be a positive number';
  }

  // stock: number >= 0 (integers preferred; DB has CHECK >= 0)
  if (stock !== undefined) {
    if (!isFiniteNumber(stock) || stock < 0) return 'Stock must be a non-negative number';
  }

  // image_url: allow empty/omitted; if present and non-empty must be http(s)
  if (image_url !== undefined) {
    if (image_url === '' || image_url === null) {
      // allow blank (main image can come from media gallery)
    } else if (!isHttpUrl(image_url)) {
      return 'Image URL must be a valid http(s) URL';
    }
  }

  // category: optional string <= 50
  if (category !== undefined) {
    if (typeof category !== 'string' || category.length > 50) {
      return 'Category must be a string under 50 characters';
    }
  }

  // is_active: must be 0 or 1 (null permitted if you intentionally clear it)
  if (is_active !== undefined) {
    if (![0, 1, null].includes(is_active)) return 'is_active must be 0, 1, or null';
  }

  // is_favorite: must be 0 or 1
  if (is_favorite !== undefined) {
    if (![0, 1].includes(is_favorite)) return 'is_favorite must be 0 or 1';
  }

  return null; // ✅ valid
};

/** -------------------------------------------------------
 * Server-only search helper (lazy imports so client bundles are safe)
 * ------------------------------------------------------*/
export const searchProducts = async (query) => {
  const { open } = await import('sqlite');
  const sqlite3 = (await import('sqlite3')).default;
  const path = (await import('path')).default;

  const dbPath = path.join(process.cwd(), 'data', 'shells_shop.db');
  const db = await open({ filename: dbPath, driver: sqlite3.Database });

  try {
    // Use parameterized LIKE to avoid injection; wrap in % on both sides
    const q = String(query ?? '').trim();
    if (!q) return [];
    return await db.all(
      `SELECT * FROM products
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY id DESC`,
      [`%${q}%`, `%${q}%`]
    );
  } catch (err) {
    console.error('❌ searchProducts failed:', err);
    throw new Error('Failed to search products');
  } finally {
    try { await db.close(); } catch {}
  }
};

// (Optionally) export the tiny helpers if you want to reuse elsewhere:
export const __utils = { isFiniteNumber, isHttpUrl };

