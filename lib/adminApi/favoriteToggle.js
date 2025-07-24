// lib/adminApi/favoriteToggle.js
export async function toggleFavorite({ id, isFavorite }) {
    const res = await fetch('/api/admin/manage_products/favorite', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ productId: id, isFavorite }),
    });
  
    if (!res.ok) {
      throw new Error('Failed to toggle favorite status');
    }
  
    return res.json();
  }
  
  