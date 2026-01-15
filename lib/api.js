// lib/api.js
// ✅ Centralized API helpers: validation, responses, and utilities

/** ---------------------------
 * Small, reusable utilities
 * --------------------------*/
const isFiniteNumber = (v) => typeof v === "number" && Number.isFinite(v);

const isHttpUrl = (s) => {
  if (typeof s !== "string" || s.trim() === "") return false;
  try {
    const u = new URL(s);
    return u.protocol === "http:" || u.protocol === "https:";
  } catch {
    return false;
  }
};

/** -------------------------------------------------------
 * Standardized JSON responses
 * Never leak HTML or stack traces in production
 * ------------------------------------------------------*/
export const sendSuccessResponse = (res, statusCode = 200, message = "OK", data = {}) => {
  try {
    const payload =
      data && typeof data === "object" && !Array.isArray(data) ? data : {};

    console.log(`[sendSuccessResponse] ✅ ${statusCode} → ${message}`);

    return res.status(statusCode).json({
      success: true,
      message,
      ...payload,
    });
  } catch (err) {
    console.error("[sendSuccessResponse] 💥 Failed to send response:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Failed to send success response" });
    }
  }
};

export const sendErrorResponse = (res, statusCode = 500, message = "Error", error = null) => {
  try {
    let errOut = error;

    // Normalize non-serializable errors
    if (error instanceof Error) {
      errOut = {
        name: error.name,
        message: error.message,
        stack: process.env.NODE_ENV === "development" ? error.stack : undefined,
      };
    } else if (error && typeof error === "object") {
      try {
        JSON.stringify(error);
      } catch {
        errOut = String(error);
      }
    }

    console.error(`[sendErrorResponse] ❌ ${statusCode} → ${message}`, errOut);

    return res.status(statusCode).json({
      success: false,
      message,
      error: errOut,
    });
  } catch (err) {
    console.error("[sendErrorResponse] 💥 Fatal error while sending response:", err);
    if (!res.headersSent) {
      res
        .status(500)
        .json({ success: false, message: "Internal error sending error response" });
    }
  }
};

/** -------------------------------------------------------
 * Product payload validation
 * Returns `null` when valid, or a string message when invalid.
 * ------------------------------------------------------*/
export const validateProductData = (data) => {
  try {
    if (!data || typeof data !== "object")
      return "Payload must be an object";

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

    // name
    if (name !== undefined) {
      if (typeof name !== "string" || name.trim().length === 0)
        return "Name must be a non-empty string";
      if (name.length > 100)
        return "Name is too long (max 100 chars)";
    }

    // description
    if (description !== undefined) {
      if (typeof description !== "string")
        return "Description must be a string";
      if (description.length > 1000)
        return "Description is too long (max 1000 chars)";
    }

    // price
    if (price !== undefined) {
      if (!isFiniteNumber(price) || price <= 0)
        return "Price must be a positive number";
    }
    if ("discount_price" in data && data.discount_price < 0) {
      return "Invalid discount price";
    }    

    // stock
    if (stock !== undefined) {
      if (!isFiniteNumber(stock) || stock < 0)
        return "Stock must be a non-negative number";
    }

    // image_url
    if (image_url !== undefined) {
      if (image_url === "" || image_url === null) {
        // allowed blank (image handled by media gallery)
      } else if (!isHttpUrl(image_url)) {
        return "Image URL must be a valid http(s) URL";
      }
    }

    // category
    if (category !== undefined) {
      if (typeof category !== "string" || category.length > 50)
        return "Category must be a string under 50 characters";
    }

    // is_active
    if (is_active !== undefined) {
      if (![0, 1, null].includes(is_active))
        return "is_active must be 0, 1, or null";
    }

    // is_favorite
    if (is_favorite !== undefined) {
      if (![0, 1].includes(is_favorite))
        return "is_favorite must be 0 or 1";
    }

    return null; // ✅ Valid payload
  } catch (err) {
    console.error("[validateProductData] 💥 Validation failed:", err);
    return "Unexpected error validating product data";
  }
};

/** -------------------------------------------------------
 * Server-side product search helper
 * ------------------------------------------------------*/
export const searchProducts = async (query) => {
  try {
    const { open } = await import("sqlite");
    const sqlite3 = (await import("sqlite3")).default;
    const path = (await import("path")).default;

    const dbPath = path.join(process.cwd(), "data", "shells_shop.db");
    const db = await open({ filename: dbPath, driver: sqlite3.Database });

    const q = String(query ?? "").trim();
    if (!q) return [];

    const result = await db.all(
      `SELECT * FROM products
       WHERE name LIKE ? OR description LIKE ?
       ORDER BY id DESC`,
      [`%${q}%`, `%${q}%`]
    );

    console.log(`[searchProducts] ✅ Found ${result.length} products for "${q}"`);
    await db.close();
    return result;
  } catch (err) {
    console.error("[searchProducts] ❌ Failed to search products:", err);
    throw new Error("Failed to search products");
  }
};

// Optionally export small helpers
export const __utils = { isFiniteNumber, isHttpUrl };
