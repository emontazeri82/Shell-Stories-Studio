import React, { useState, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useDispatch } from 'react-redux';

import { fetchProducts } from '@/lib/adminApi/productFetchers';
import { deleteProduct } from '@/lib/adminApi/productActions';
import { toggleActiveStatus } from '@/lib/adminApi/activationToggle';
import { toggleFavorite } from '@/lib/adminApi/favoriteToggle';

import { upsertProductsInStore } from '@/redux/slices/productsSlice';
import { ADMIN_FAVORITES_MAX } from '@/lib/constant';

import BulkActions from './BulkActions';
import BulkUpdateModal from './BulkUpdateModal';
import ProductTable from './ProductTable';

/**
 * ProductList component:
 * - Fetches all products
 * - Handles deletion, bulk updates, and favorite toggles
 * - Uses React Query for caching + Redux for cross-page sync
 */
export default function ProductList({ searchQuery, sortOrder }) {
  const dispatch = useDispatch();
  const queryClient = useQueryClient();

  const [expandedRows, setExpandedRows] = useState({});
  const [selected, setSelected] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [updateField, setUpdateField] = useState(null);

  // ✅ Memoize query key for consistency
  const queryKey = useMemo(() => ['products', { sortOrder, q: searchQuery || '' }], [sortOrder, searchQuery]);

  // ────────────────────────────────
  // Fetch products
  // ────────────────────────────────
  const { data, error, isLoading } = useQuery({
    queryKey,
    queryFn: () => fetchProducts({ sortOrder, q: searchQuery }),
    refetchOnWindowFocus: false,
    keepPreviousData: true,
  });

  const products = data?.products || [];

  // ────────────────────────────────
  // Delete product mutation
  // ────────────────────────────────
  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
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
      alert(err.message || 'Failed to delete product');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ────────────────────────────────
  // Toggle active mutation
  // ────────────────────────────────
  const toggleActiveMutation = useMutation({
    mutationFn: toggleActiveStatus,
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey });
      const previous = queryClient.getQueryData(queryKey);

      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        products: old?.products?.map((p) =>
          p.id === id ? { ...p, is_active: isActive } : p
        ) || [],
      }));

      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      console.error('❌ Activation toggle failed:', err);
      alert(err.message || 'Failed to toggle activation');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ────────────────────────────────
  // Toggle favorite mutation
  // ────────────────────────────────
  const toggleFavoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onMutate: async ({ id, isFavorite }) => {
      const previous = queryClient.getQueryData(queryKey);
      queryClient.setQueryData(queryKey, (old) => ({
        ...old,
        products: old?.products?.map((p) =>
          p.id === id ? { ...p, is_favorite: isFavorite ? 1 : 0 } : p
        ) || [],
      }));
      return { previous };
    },
    onError: (err, _, context) => {
      if (context?.previous) queryClient.setQueryData(queryKey, context.previous);
      alert(err.message || 'Failed to toggle favorite');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey }),
  });

  // ────────────────────────────────
  // Bulk operations
  // ────────────────────────────────
  const handleBulkDelete = () => {
    if (!selected.length) return alert('No products selected.');
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
      await Promise.all(
        targetIds.map(async (id) => {
          const res = await fetch(`/api/admin/manage_products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ [field]: value }),
          });
          if (!res.ok) throw new Error(`Failed to update id=${id}`);
        })
      );

      dispatch(upsertProductsInStore(targetIds.map((id) => ({ id, [field]: value }))));
      queryClient.invalidateQueries({ queryKey });
      alert('Bulk update successful!');
    } catch (err) {
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
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const handleSelectAll = () =>
    setSelected(selected.length === products.length ? [] : products.map((p) => p.id));

  const toggleRow = (id) =>
    setExpandedRows((prev) => ({ ...prev, [id]: !prev[id] }));

  // ────────────────────────────────
  // Rendering
  // ────────────────────────────────
  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div className="text-red-600">Error loading products.</div>;

  const filteredProducts = searchQuery
    ? products.filter((p) => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  return (
    <div className="p-4 bg-white shadow-md rounded-md">
      <h2 className="text-xl font-semibold mb-4">Product List</h2>

      {selected.length > 0 && (
        <BulkActions
          selected={selected}
          onBulkDelete={handleBulkDelete}
          onBulkActivate={(isActive) =>
            selected.forEach((id) => toggleActiveMutation.mutate({ id, isActive }))
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
        toggleActiveMutation={toggleActiveMutation}
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


