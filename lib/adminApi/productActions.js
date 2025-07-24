// Create a new product
export async function createProduct(productData) {
    const res = await fetch('/api/admin/manage_products', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(productData),
    });
  
    if (!res.ok) {
      throw new Error('Failed to create product');
    }
  
    return res.json();
  }
  
  // Update product by ID
  export async function updateProductById(id, updatedData) {
    const res = await fetch(`/api/admin/manage_products/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updatedData),
    });
  
    if (!res.ok) {
      throw new Error('Failed to update product');
    }
  
    return res.json();
  }
  
  // Delete a product
  export async function deleteProduct(id) {
    const res = await fetch(`/api/admin/manage_products/${id}`, {
      method: 'DELETE',
    });
  
    console.log('🧪 DELETE response status:', res.status); // <--- Add this
  
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      console.error('❌ Delete API Error:', err);
      throw new Error(err?.error || 'Failed to delete product');
    }
  
    return res.json();
  }
  
  