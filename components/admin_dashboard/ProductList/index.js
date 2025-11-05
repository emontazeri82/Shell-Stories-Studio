"use client";

import React, { useState, useMemo } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useDispatch } from "react-redux";
import axios from "axios";

import { upsertProductsInStore } from "@/redux/slices/productsSlice";
import { ADMIN_FAVORITES_MAX } from "@/lib/constant";

import BulkActions from "./BulkActions";
import BulkUpdateModal from "./BulkUpdateModal";
import ProductTable from "./ProductTable";

export default function ProductList({ searchQuery, sortOrder }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [expandedRows, setExpandedRows] = useState({});
  const [selected, setSelected] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateField, setUpdateField] = useState(null);

  // ✅ Memoized query key
  const queryKey = useMemo(
    () => ["products", { sortOrder, q: searchQuery || "" }],
    [sortOrder, searchQuery]
  );

  // ────────────────────────────────
  // Fetch products (using Axios)
  // ────────────────────────────────
  const { data, error, isLoading } = useQuery({
    queryKey,
    queryFn: async () => {
      try {
        // ✅ AXIOS_URL: /api/admin/manage_products
        const url = `/api/admin/manage_products?q=${searchQuery || ""}&sort=${sortOrder || ""}`;
        console.log("[Axios] Calling:", url);
        const { data } = await axios.get(url);
        return data;
      } catch (err) {
        console.error("[Axios] Error at:", "/api/admin/manage_products", err);
        throw err;
      }
    },
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const products = data?.products || [];

  // ────────────────────────────────
  // Delete product (Axios)
  // ────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: async (id) => {
      try {
        // ✅ AXIOS_URL: /api/admin/manage_products/${id}
        console.log("[Axios] Calling:", `/api/admin/manage_products/${id}`);
        const { data } = await axios.delete(`/api/admin/manage_products/${id}`);
        if (!data.success) {
          throw new Error(data.error || data.message || "Failed to delete product");
        }
        console.log("[Axios] ✅ Deleted product:", id);
        return data;
      } catch (err) {
        console.error("[Axios] Error at:", `/api/admin/manage_products/${id}`, err);
        throw err;
      }
    },
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        products: old?.products?.filter((p) => p.id !== deletedId) || [],
      }));
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      alert(err.message || "Failed to delete product");
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ────────────────────────────────
  // Toggle active status (Axios)
  // ────────────────────────────────
  const toggleFavoriteMutation = useMutation({
    mutationFn: async ({ id, isFavorite }) => {
      // ✅ AXIOS_URL: /api/admin/manage_products/favorite
      const url = `/api/admin/manage_products/favorite`;
      console.log("[Axios] Calling:", url);
      console.log("📦 Payload:", { productId: id, isFavorite: isFavorite ? 1 : 0 });

      try {
        const { data } = await axios.post(
          url,
          { productId: id, isFavorite: isFavorite ? 1 : 0 }, // ✅ matches sanitizer
          { headers: { "Content-Type": "application/json" } }
        );

        if (!data?.ok) {
          console.error("[Axios] ❌ Backend responded with error:", data);
          throw new Error(data.error || "Failed to toggle favorite");
        }

        console.log("[Axios] ✅ Server response:", data);
        return data;
      } catch (err) {
        console.error("[Axios] Error at:", url, err);
        if (err.response) {
          console.error("❌ Server responded with:", err.response.data);
        }
        throw new Error(err.response?.data?.error || err.message || "Network error");
      }
    },

    // 🧠 Optimistic update — update UI immediately before server confirms
    onMutate: async ({ id, isFavorite }) => {
      console.log("[React Query] ⚡ Optimistic toggle for id:", id, "→", isFavorite);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        products:
          old?.products?.map((p) =>
            p.id === id ? { ...p, is_favorite: isFavorite ? 1 : 0 } : p
          ) || [],
      }));

      return { previous };
    },

    // ❌ Rollback on error
    onError: (err, _, context) => {
      console.error("[React Query] ❌ Error toggling favorite:", err);
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      alert(err.message || "Failed to toggle favorite");
    },

    // ✅ Refetch on success to sync state
    onSuccess: (data) => {
      console.log("[React Query] ✅ Favorite updated successfully:", data);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ────────────────────────────────
  // Toggle Active Status (Axios)
  // ────────────────────────────────
  const toggleActiveMutation = useMutation({
    mutationFn: async ({ id, isActive }) => {
      // ✅ AXIOS_URL: /api/admin/manage_products/${id}
      const url = `/api/admin/manage_products/${id}`;
      console.log("[Axios] Calling:", url);
      console.log("📦 Payload:", { is_active: isActive });

      try {
        const { data } = await axios.patch(
          url,
          { is_active: isActive ? 1 : 0 },
          { headers: { "Content-Type": "application/json" } }
        );

        if (!(data?.ok || data?.success)) {
          console.error("[Axios] ❌ Backend responded with error:", data);
          throw new Error(data.error || "Failed to toggle active status");
        }


        console.log("[Axios] ✅ Server response:", data);
        return data;
      } catch (err) {
        console.error("[Axios] Error at:", url, err);
        if (err.response) {
          console.error("❌ Server responded with:", err.response.data);
        }
        throw new Error(err.response?.data?.error || err.message || "Network error");
      }
    },

    // 🧠 Optimistic UI update
    onMutate: async ({ id, isActive }) => {
      console.log("[React Query] ⚡ Optimistic toggle active for id:", id, "→", isActive);
      await queryClient.cancelQueries({ queryKey });

      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        products:
          old?.products?.map((p) =>
            p.id === id ? { ...p, is_active: isActive ? 1 : 0 } : p
          ) || [],
      }));

      return { previous };
    },

    // ❌ Rollback on error
    onError: (err, _, context) => {
      console.error("[React Query] ❌ Error toggling active:", err);
      if (context?.previous) {
        queryClient.setQueryData(queryKey, context.previous);
      }
      alert(err.message || "Failed to toggle active status");
    },

    // ✅ Refetch after success
    onSuccess: (data) => {
      console.log("[React Query] ✅ Active status updated successfully:", data);
      queryClient.invalidateQueries({ queryKey });
    },
  });

  // ────────────────────────────────
  // Bulk Update / Delete (Axios)
  // ────────────────────────────────
  const handleBulkDelete = () => {
    if (!selected.length) return alert("No products selected.");
    if (confirm(`Delete ${selected.length} products?`)) {
      selected.forEach((id) => deleteMutation.mutate(id));
      setSelected([]);
    }
  };

  const handleBulkUpdate = (field) => {
    setUpdateField(field);
    setIsModalOpen(true);
  };

  const handleModalSave = async (updateData) => {
    const field = Object.keys(updateData)[0];
    const value = updateData[field];
    const targetIds = [...selected];
    if (!targetIds.length) return;

    // Optimistic update
    await queryClient.cancelQueries({ queryKey });
    const previous = queryClient.getQueryData(queryKey);
    queryClient.setQueryData(queryKey, (old) => ({
      ...old,
      products: old.products.map((p) =>
        targetIds.includes(p.id) ? { ...p, [field]: value } : p
      ),
    }));

    try {
      // ✅ AXIOS_URL: /api/admin/manage_products/${id} (bulk PUT)
      await Promise.all(
        targetIds.map(async (id) => {
          const url = `/api/admin/manage_products/${id}`;
          console.log("[Axios] Calling:", url);
          const { data } = await axios.put(url, { [field]: value });
          if (!data.ok) throw new Error(`Failed to update id=${id}`);
        })
      );

      dispatch(
        upsertProductsInStore(targetIds.map((id) => ({ id, [field]: value })))
      );
      queryClient.invalidateQueries({ queryKey });
      alert("Bulk update successful!");
    } catch (err) {
      console.error("[Axios] Error at:", `/api/admin/manage_products (bulk PUT)`, err);
      queryClient.setQueryData(queryKey, previous);
      alert(`Bulk update failed: ${err.message}`);
    } finally {
      setSelected([]);
      setIsModalOpen(false);
    }
  };

  // ────────────────────────────────
  // UI Handlers
  // ────────────────────────────────
  const handleToggleSelect = (id) =>
    setSelected((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );

  const handleSelectAll = () =>
    setSelected(
      selected.length === products.length ? [] : products.map((p) => p.id)
    );

  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // ────────────────────────────────
  // Rendering
  // ────────────────────────────────
  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div className="text-red-600">Error loading products.</div>;

  const filteredProducts = searchQuery
    ? products.filter((p) =>
      p.name.toLowerCase().includes(searchQuery.toLowerCase())
    )
    : products;

  return (
    <div className="p-4 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-semibold mb-4">Product List</h2>

      {selected.length > 0 && (
        <BulkActions
          selected={selected}
          onBulkDelete={handleBulkDelete}
          onBulkActivate={(isActive) =>
            selected.forEach((id) =>
              toggleActiveMutation.mutate({ id, isActive })
            )
          }
          onBulkUpdate={handleBulkUpdate}
        />
      )}

      <ProductTable
        products={filteredProducts}
        selected={selected}
        expandedRows={expandedRows}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onDelete={(id) => deleteMutation.mutate(id)}
        onToggleFavorite={(id, isFavorite) =>
          toggleFavoriteMutation.mutate({ id, isFavorite: !isFavorite })
        }
        onToggleRow={toggleRow}
        toggleActiveMutation={toggleActiveMutation.mutate}  // ✅ pass mutate directly
      />

      <BulkUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        field={updateField}
      />

    </div>
  );
}



