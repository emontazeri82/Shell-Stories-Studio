// components/useFavoriteMapping.js
export function getImagePaths(productId) {
    if (!productId || typeof productId !== "number") {
      throw new Error("Invalid productId");
    }
  
    return {
      favoriteImage: `/assets/images/favorites/fav${productId}.png`,
      productImage: `/assets/images/products/image${productId}.jpg`,
    };
  }
  