// lib/api.js

// Standardized response format for success
export const sendSuccessResponse = (res, statusCode, message, data = null) => {
  res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

// Standardized response format for errors
export const sendErrorResponse = (res, statusCode, message, error = null) => {
  res.status(statusCode).json({
    success: false,
    message,
    error,
  });
};

// Check if the data required for product creation or update is valid
export const validateProductData = (data) => {
  console.log("🔍 Validating data:", data);

  const {
    name,
    description,
    price,
    stock,
    image_url,
    category,
    is_active,
    is_favorite
  } = data;

  // Name: required string, 1–100 chars
  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return 'Name must be a non-empty string';
    }
    if (name.length > 100) return 'Name is too long';
  }

  // Description: optional string
  if (description !== undefined) {
    if (typeof description !== 'string') {
      return 'Description must be a string';
    }
    if (description.length > 1000) return 'Description is too long';
  }

  // Price: required number > 0
  if (price !== undefined) {
    if (typeof price !== 'number' || isNaN(price) || price <= 0) {
      return 'Price must be a positive number';
    }
  }

  // Stock: number >= 0
  if (stock !== undefined) {
    if (typeof stock !== 'number' || isNaN(stock) || stock < 0) {
      return 'Stock must be a non-negative number';
    }
  }

  // Image URL: valid string or Cloudinary link
  if (image_url !== undefined) {
    if (typeof image_url !== 'string' || !image_url.startsWith('https://res.cloudinary.com/')) {
      return 'Image URL must be a valid Cloudinary link';
    }
  }

  // Category: optional string, max 50 chars
  if (category !== undefined) {
    if (typeof category !== 'string' || category.length > 50) {
      return 'Category must be a string under 50 characters';
    }
  }

  // is_active: must be 0 or 1
  if (is_active !== undefined) {
    if (is_active !== 0 && is_active !== 1 && is_active !== null) {
      return 'is_active must be 0, 1, or null';
    }
  }

  // is_favorite: must be 0 or 1
  if (is_favorite !== undefined) {
    if (is_favorite !== 0 && is_favorite !== 1) {
      return 'is_favorite must be 0 or 1';
    }
  }

  return null; // ✅ No validation errors
};



// Search products (optional for your use case)
export const searchProducts = async (query) => {
  const db = await openDB();
  try {
    const results = await db.all(
      `SELECT * FROM products WHERE name LIKE ? OR description LIKE ?`,
      [`%${query}%`, `%${query}%`]
    );
    return results;
  } catch (err) {
    console.error('Error searching products:', err);
    throw new Error('Failed to search products');
  }
};
