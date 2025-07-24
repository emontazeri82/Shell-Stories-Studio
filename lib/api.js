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
  const { name, description, price, stock, image_url, category } = data;

  if (name !== undefined && typeof name !== 'string') {
    return 'Name must be a string';
  }

  if (description !== undefined && typeof description !== 'string') {
    return 'Description must be a string';
  }

  if (price !== undefined && (typeof price !== 'number' || price <= 0)) {
    return 'Price must be a positive number';
  }

  if (stock !== undefined && (typeof stock !== 'number' || stock < 0)) {
    return 'Stock must be a non-negative number';
  }

  if (image_url !== undefined && typeof image_url !== 'string') {
    return 'Image URL must be a string';
  }

  if (category !== undefined && typeof category !== 'string') {
    return 'Category must be a string';
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
