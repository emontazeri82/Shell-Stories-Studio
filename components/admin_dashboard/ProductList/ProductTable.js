"use client";
import React, { useState } from "react";
import axios from "axios";
import { useRouter } from "next/router";
import ProductDetailsRow from "./ProductDetailsRow";

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
  toggleDiscountMutation,
  setDiscountPercentMutation, // ✅ ADD THIS
}) {
  const router = useRouter();

  // 🧠 Track which product’s details are currently loading
  const [loadingId, setLoadingId] = useState(null);
  // 🧠 Store fetched product details for expanded rows
  const [expandedData, setExpandedData] = useState({});
  // ✅ ADD THIS BLOCK RIGHT HERE ⬇️
  const isDiscountUpdating =
  toggleDiscountMutation.isPending ||
  setDiscountPercentMutation.isPending;

  console.log("[ProductTable] Rendering with products:", products?.length || 0);

  // ────────────────────────────────
  // 🔹 Fetch product details (with media)
  // ────────────────────────────────
  const handleToggleDetails = async (productId) => {
    const isAlreadyExpanded = expandedRows[productId];
    if (isAlreadyExpanded) {
      onToggleRow(productId);
      return;
    }

    try {
      setLoadingId(productId);
      const { data } = await axios.get(`/api/admin/manage_products/${productId}`);
      if (!data?.product) return;

      setExpandedData((prev) => ({ ...prev, [productId]: data.product }));
      onToggleRow(productId);
    } catch (err) {
      console.error("[ProductTable] ❌ Failed to fetch details:", err);
      alert("Failed to load product details.");
    } finally {
      setLoadingId(null);
    }
  };

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
        {products.map((product) => {
          const isExpanded = expandedRows[product.id];
          const detailedProduct = expandedData[product.id];

          // ✅ NEW SYSTEM: compute discounted price in UI
          const discountedPrice =
            product.discount_active === 1
              ? (
                Math.round(
                  product.price * (100 - product.discount_percent)
                ) / 100
              ).toFixed(2)
              : null;

          return (
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

                <td className="p-2">
                  <div className="flex flex-col">
                    <span
                      className={
                        product.discount_active ? "line-through text-gray-400" : ""
                      }
                    >
                      ${product.price}
                    </span>

                    {product.discount_active === 1 && (
                      <span className="text-red-600 font-semibold">
                        ${discountedPrice}
                      </span>
                    )}
                  </div>
                </td>

                <td className="p-2">{product.category}</td>
                <td className="p-2">{product.stock}</td>
                <td className="p-2">
                  {new Date(product.created_at).toLocaleDateString()}
                </td>

                <td className="p-2">
                  <div className="flex flex-wrap gap-2">
                    {/* Edit */}
                    <button
                      className="bg-blue-500 text-white text-sm py-1 px-4 rounded"
                      onClick={() =>
                        router.push(`/admin/admin_inventory/${product.id}`)
                      }
                    >
                      Edit
                    </button>

                    {/* Delete */}
                    <button
                      className="bg-red-500 text-white text-sm py-1 px-4 rounded disabled:opacity-50"
                      disabled={isDeleting}
                      onClick={() => {
                        if (
                          window.confirm(
                            `⚠️ Are you sure you want to permanently delete "${product.name}"?`
                          )
                        ) {
                          onDelete(product.id);
                        }
                      }}
                    >
                      Delete
                    </button>

                    {/* Activate / Deactivate */}
                    <button
                      className={`w-28 py-1 px-3 text-sm rounded ${product.is_active ? "bg-green-600" : "bg-gray-500"
                        } text-white`}
                      onClick={() =>
                        toggleActiveMutation({
                          id: product.id,
                          isActive: product.is_active ? 0 : 1,
                        })
                      }
                    >
                      {product.is_active ? "Activated ✅" : "Deactivated 🚫"}
                    </button>

                    {/* Favorite */}
                    <button
                      className={`w-24 py-1 px-4 text-xs rounded ${product.is_favorite ? "bg-yellow-500" : "bg-gray-500"
                        }`}
                      onClick={() =>
                        onToggleFavorite(product.id, product.is_favorite)
                      }
                    >
                      {product.is_favorite ? "Favorited ⭐️" : "Not Favorite"}
                    </button>

                    {/* Discount Toggle */}
                    <button
                      className={`w-28 py-1 px-3 text-sm rounded ${product.discount_active ? "bg-red-600" : "bg-gray-500"
                        } text-white`}
                      onClick={() => {
                        toggleDiscountMutation({
                          id: product.id,
                          discountActive: product.discount_active ? 0 : 1,
                        });
                      }}
                    >
                      {product.discount_active ? "Discount ON 💸" : "Discount OFF"}
                    </button>

                    {/* Quick Discount % */}
                    {product.discount_active === 1 && (
                      <div className="flex gap-1">
                        {[10, 20, 30].map((percent) => (
                          <button
                            key={percent}
                            disabled={isDiscountUpdating}
                            className={`text-xs px-2 py-1 rounded
                            ${product.discount_percent === percent
                                ? "bg-indigo-600 text-white"
                                : "bg-indigo-100 text-indigo-700"}
                            ${isDiscountUpdating ? "opacity-50 cursor-not-allowed" : ""}
                          `}
                          onClick={() =>
                            setDiscountPercentMutation.mutate({
                              id: product.id,
                              percent,
                            })
                          }                          
                          >
                            {percent}%
                          </button>
                        ))}
                      </div>
                    )}

                    {/* Details */}
                    <button
                      onClick={() => handleToggleDetails(product.id)}
                      disabled={loadingId === product.id}
                      className="bg-gray-300 text-black text-sm px-3 py-1 rounded"
                    >
                      {loadingId === product.id
                        ? "Loading..."
                        : isExpanded
                          ? "Hide"
                          : "Details"}
                    </button>
                  </div>
                </td>
              </tr>

              {isExpanded && (
                <ProductDetailsRow product={product} />
              )}
            </React.Fragment>
          );
        })}

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


