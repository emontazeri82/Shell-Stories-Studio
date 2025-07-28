// lib/utils/anitizeFavoriteToggle.js
export function sanitizeFavoriteToggle(input) {
    const productId = Number(input.productId);
    const is_favorite = Number(input.isFavorite);
  
    const valid = Number.isInteger(productId) && [0, 1].includes(is_favorite);
  
    if (!valid) {
      return { error: 'Invalid productId or isFavorite', sanitized: null };
    }
  
    return { error: null, sanitized: { productId, is_favorite } };
  }
  