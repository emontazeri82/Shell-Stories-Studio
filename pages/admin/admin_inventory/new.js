import ProductForm from '@/components/admin_dashboard/ProductForm';

export default function NewProductPage() {
    return (
        <div className="p-8">
            <div className="max-w-2xl mx-auto bg-white p-6 rounded shadow">
                <h1 className="text-2xl font-bold mb-4 text-center">➕ Add New Product</h1>
                <ProductForm />
            </div>
        </div>
    );
}
