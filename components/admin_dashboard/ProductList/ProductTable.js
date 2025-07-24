// components/admin_dashboard/ProductList/ProductTable.js
import React from 'react';
import { useRouter } from 'next/router';
import ProductDetailsRow from './ProductDetailsRow';

export default function ProductTable({
    products,
    selected,
    expandedRows,
    isDeleting,
    onSelectAll,
    onToggleSelect,
    onDelete,
    onToggleFavorite,
    onToggleRow,
    toggleActiveMutation,
}) {
    const router = useRouter();

    return (
        <table className="w-full table-auto border-collapse">
            <thead>
                <tr className="bg-gray-200">
                    <th className="p-2">
                        <input
                            type="checkbox"
                            checked={selected.length === products.length && products.length > 0}
                            onChange={onSelectAll}
                        />
                    </th>
                    <th className="p-2">Name</th>
                    <th className="p-2">Price</th>
                    <th className="p-2">Category</th>
                    <th className="p-2">Stock</th>
                    <th className="p-2">Created At</th>
                    <th className="p-2">Actions</th>
                </tr>
            </thead>
            <tbody>
                {products.map((product) => (
                    <React.Fragment key={product.id}>
                        <tr className="border-t">
                            <td className="p-2">
                                <input
                                    type="checkbox"
                                    checked={selected.includes(product.id)}
                                    onChange={() => onToggleSelect(product.id)}
                                />
                            </td>
                            <td className="p-2">{product.name}</td>
                            <td className="p-2">${product.price}</td>
                            <td className="p-2">{product.category}</td>
                            <td className="p-2">{product.stock}</td>
                            <td className="p-2">{new Date(product.created_at).toLocaleDateString()}</td>
                            <td className="p-2">
                                <div className="flex flex-wrap gap-2">
                                    <button
                                        className="bg-blue-500 text-white text-sm py-1 px-4 rounded"
                                        onClick={() => router.push(`/admin/admin_inventory/${product.id}`)}
                                    >
                                        Edit
                                    </button>
                                    <button
                                        className="bg-red-500 text-white text-sm py-1 px-4 rounded ml-2 disabled:opacity-50"
                                        onClick={() => onDelete(product.id)}
                                        disabled={isDeleting}
                                    >
                                        Delete
                                    </button>
                                    <button
                                        className={`w-28 inline-flex justify-center py-1 px-3 text-sm rounded ${product.is_active ? 'bg-green-600' : 'bg-gray-500'} text-white`}
                                        onClick={() => {
                                            console.log('⏩ Toggling active:', { id: product.id, isActive: product.is_active ? 0 : 1 });
                                            toggleActiveMutation({ id: product.id, isActive: product.is_active ? 0 : 1 });
                                        }}
                                    >
                                        {product.is_active ? 'Activated ✅' : 'Deactivated 🚫'}

                                    </button>

                                    <button
                                        className={`w-24 inline-flex justify-center items-center py-1 px-4 text-xs rounded ml-2 ${Number(product.is_favorite) === 1 ? 'bg-yellow-500' : 'bg-gray-500'}`}
                                        onClick={() => onToggleFavorite(product.id, product.is_favorite)}
                                    >
                                        {Number(product.is_favorite) === 1 ? 'Favorited ⭐️' : 'Not Favorite'}
                                    </button>
                                    <button
                                        onClick={() => onToggleRow(product.id)}
                                        className="bg-gray-300 text-black text-sm ml-2 px-3 py-1 rounded"
                                    >
                                        {expandedRows[product.id] ? 'Hide' : 'Details'}
                                    </button>
                                </div>
                            </td>
                        </tr>
                        {expandedRows[product.id] && (
                            <>
                                {console.log("📦 Expanded Row Product:", product)}
                                <ProductDetailsRow product={product} />
                            </>
                        )}

                    </React.Fragment>
                ))}
                {products.length === 0 && (
                    <tr>
                        <td colSpan="7" className="text-center text-gray-500 p-4">
                            No products match your search.
                        </td>
                    </tr>
                )}
            </tbody>
        </table>
    );
}
