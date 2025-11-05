// /pages/admin/admin_inventory/[id].js
import { useRouter } from "next/router";
import ProductForm from "@/components/admin_dashboard/product_form/ProductForm";

export default function EditProductPage() {
  const router = useRouter();
  const { id } = router.query;

  // While waiting for the router to populate `id`
  if (!id) {
    return (
      <div className="p-8 text-gray-600">
        <p>Loading product...</p>
      </div>
    );
  }

  // Defensive numeric check
  if (isNaN(Number(id))) {
    return (
      <div className="p-8 text-red-600">
        <p>Invalid product ID.</p>
      </div>
    );
  }

  // ✅ Only pass productId; ProductForm handles fetching and media logic itself
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Edit Product</h1>
      <ProductForm productId={id} />
    </div>
  );
}


