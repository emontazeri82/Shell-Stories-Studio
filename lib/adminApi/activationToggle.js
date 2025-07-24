
export async function toggleActiveStatus({ id, isActive }) {
    // ✅ Log the input values clearly
    console.log('🧪 toggleActiveStatus called with:', { id, isActive });
  
    // ✅ Log the actual fetch endpoint and payload
    const url = `/api/admin/manage_products/${id}`;
    console.log(`📡 Sending PATCH to: ${url}`);
    console.log('📦 Payload:', { is_active: isActive });
  
    const res = await fetch(url, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: isActive }),
    });
  
    // ✅ Handle failure with response details
    if (!res.ok) {
      const errorText = await res.text();
      console.error('❌ Server responded with error:', errorText);
      throw new Error('Failed to update active status');
    }
  
    const data = await res.json();
    console.log('✅ Server response:', data);
    return data;
  }
   
  