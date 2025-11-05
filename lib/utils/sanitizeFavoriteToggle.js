// /lib/utils/sanitizeFavoriteToggle.js
export function sanitizeFavoriteToggle(input) {
  try {
    if (!input || typeof input !== "object") {
      return { error: "Invalid input type", sanitized: null };
    }

    // 🧠 Accept both camelCase and snake_case
    const productId = Number(input.productId ?? input.product_id);
    const is_favorite = Number(input.isFavorite ?? input.is_favorite);

    const valid =
      Number.isInteger(productId) &&
      productId > 0 &&
      [0, 1].includes(is_favorite);

    if (!valid) {
      console.warn("[sanitizeFavoriteToggle] ⚠️ Invalid fields:", input);
      return { error: "Invalid productId or isFavorite", sanitized: null };
    }

    const sanitized = { productId, is_favorite };
    console.log("[sanitizeFavoriteToggle] ✅ Sanitized:", sanitized);
    return { error: null, sanitized };
  } catch (err) {
    console.error("[sanitizeFavoriteToggle] 💥 Error:", err);
    return { error: err.message || "Unexpected error", sanitized: null };
  }
}
