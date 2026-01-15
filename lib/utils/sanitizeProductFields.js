// /lib/sanitize/sanitizeProductFields.js
import sanitizeHtml from "sanitize-html";

export function sanitizeProductFields(input = {}) {
  try {
    if (!input || typeof input !== "object") {
      console.warn("[sanitizeProductFields] ⚠️ Invalid input:", input);
      return {};
    }

    // 🧠 Normalize both camelCase and snake_case keys
    const normalized = {
      name: input.name,
      description: input.description,
      price: input.price,
      stock: input.stock,

      // 🔹 media
      image_url: input.image_url ?? input.imageUrl,
      image_public_id: input.image_public_id ?? input.imagePublicId,

      // 🔹 category & flags
      category: input.category,
      is_active: input.is_active ?? input.isActive,
      is_favorite: input.is_favorite ?? input.isFavorite,

      // 🔹 discount (ADDED)
      discount_active: input.discount_active ?? input.discountActive,
      discount_percent: input.discount_percent ?? input.discountPercent,
    };

    const sanitized = {
      name: sanitizeText(normalized.name),
      description: sanitizeHtml(normalized.description || "", {
        allowedTags: [],
        allowedAttributes: {},
      }),
      price: sanitizeNumber(normalized.price),
      stock: sanitizeInteger(normalized.stock),

      image_url: sanitizeUrl(normalized.image_url),
      image_public_id: sanitizeText(normalized.image_public_id),
      category: sanitizeText(normalized.category),

      // 🔹 flags
      is_active: Number(normalized.is_active) === 1 ? 1 : 0,
      is_favorite: Number(normalized.is_favorite) === 1 ? 1 : 0,

      // 🔹 discount (ADDED)
      discount_active: Number(normalized.discount_active) === 1 ? 1 : 0,
      discount_percent: sanitizeInteger(normalized.discount_percent),
    };

    console.log("[sanitizeProductFields] ✅ Sanitized fields:", sanitized);
    return sanitized;
  } catch (err) {
    console.error("[sanitizeProductFields] 💥 Error:", err);
    return {};
  }
}

// ──────────────────────────────
// Helper functions
// ──────────────────────────────
function sanitizeText(text) {
  return String(text || "").trim().slice(0, 255);
}

function sanitizeNumber(value) {
  const num = parseFloat(value);
  return isNaN(num) || num < 0 ? 0 : Number(num.toFixed(2));
}

function sanitizeInteger(value) {
  const int = parseInt(value, 10);
  return isNaN(int) || int < 0 ? 0 : int;
}

function sanitizeUrl(url) {
  try {
    const u = new URL(String(url || "").trim());
    return u.href;
  } catch {
    return "";
  }
}

