// pages/admin/admin_inventory/[id].js
import { useRouter } from 'next/router';
import ProductForm from '@/components/admin_dashboard/ProductForm';

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;

  // Show loading while the ID is not yet available
  if (!id) {
    return (
      <div className="p-8 text-gray-600">
        <p>Loading product...</p>
      </div>
    );
  }

  // Defensive check for non-numeric IDs (if you're using numeric IDs)
  if (isNaN(Number(id))) {
    return (
      <div className="p-8 text-red-600">
        <p>Invalid product ID.</p>
      </div>
    );
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <ProductForm productId={id} />
    </div>
  );
}

