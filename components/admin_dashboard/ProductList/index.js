// components/admin_dashboard/ProductList/index.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toggleActiveStatus } from '@/lib/adminApi/activationToggle';
import { fetchProducts } from '@/lib/adminApi/productFetchers';
import { deleteProduct } from '@/lib/adminApi/productActions';
import { toggleFavorite } from '@/lib/adminApi/favoriteToggle';

import BulkUpdateModal from './BulkUpdateModal';
import BulkActions from './BulkActions';
import ProductTable from './ProductTable';

import { useDispatch } from 'react-redux';
import { upsertProductsInStore } from "@/redux/slices/productsSlice";
import { ADMIN_FAVORITES_MAX } from '@/lib/constant';

const ProductList = ({ searchQuery, sortOrder }) => {
  const queryClient = useQueryClient();
  const [expandedRows, setExpandedRows] = useState({});
  const [selected, setSelected] = useState([]);
  const [updateField, setUpdateField] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const dispatch = useDispatch();
  //const router = useRouter();


  const { data, error, isLoading } = useQuery({
    queryKey: ['products', { sortOrder }],
    queryFn: () => fetchProducts({ sortOrder }),
    refetchOnWindowFocus: true,
  });

  const products = data?.products || [];

  const deleteMutation = useMutation({
    mutationFn: deleteProduct,
    onMutate: async (deletedId) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });
      const previousData = queryClient.getQueryData(['products']);
      queryClient.setQueryData(['products'], old => ({
        ...old,
        products: old?.products?.filter(p => p.id !== deletedId) || [],
      }));
      return { previousData };
    },
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['products'], context.previousData);
      }
      alert(err.message || 'Failed to delete product');
    },
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: ['products'] });
    },
  });

  const toggleFavoriteMutation = useMutation({
    mutationFn: toggleFavorite,
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['products'] }),
    onError: (err) => alert(err.message || 'Failed to toggle favorite status.'),
  });

  const { mutate: toggleActiveMutation } = useMutation({
    mutationFn: toggleActiveStatus,

    // Optimistic update
    onMutate: async ({ id, isActive }) => {
      await queryClient.cancelQueries({ queryKey: ['products'] });

      const previousData = queryClient.getQueryData(['products']);

      queryClient.setQueryData(['products'], old => ({
        ...old,
        products: old?.products?.map(p =>
          p.id === id ? { ...p, is_active: isActive } : p
        ) || [],
      }));

      return { previousData };
    },

    // Rollback on error
    onError: (err, _, context) => {
      if (context?.previousData) {
        queryClient.setQueryData(['products'], context.previousData);
      }
      console.error('❌ Activation toggle failed:', err);
      alert(err.message || 'Failed to toggle activation');
    },

    // Ensure fresh data from DB
    onSuccess: async () => {
      // ✅ Match your fetch query key shape
      const queryKey = ['products', { sortOrder: sortOrder || 'created_at DESC' }];
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.refetchQueries({ queryKey });
    },
  });



  const filteredProducts = searchQuery
    ? products.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()))
    : products;

  const handleDelete = (id) => {
    if (confirm('Are you sure you want to delete this product?')) {
      deleteMutation.mutate(id);
    }
  };

  const handleToggleFavorite = (id, isFavorite) => {
    const count = products.filter(p => p.is_favorite).length;
    if (!isFavorite && count >= ADMIN_FAVORITES_MAX) return alert('❌ Max 15 favorite products.');
    toggleFavoriteMutation.mutate({ id, isFavorite: isFavorite ? 0 : 1 });
  };

  const toggleRow = (id) => {
    setExpandedRows(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleToggleSelect = (id) => {
    setSelected(prev => prev.includes(id) ? prev.filter(pid => pid !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    setSelected(selected.length === filteredProducts.length ? [] : filteredProducts.map(p => p.id));
  };

  const handleBulkDelete = () => {
    if (confirm(`Delete ${selected.length} selected products?`)) {
      selected.forEach(id => deleteMutation.mutate(id));
      setSelected([]);
    }
  };
  const handleBulkUpdate = (field) => {
    setUpdateField(field);
    setIsModalOpen(true);
  };


  const handleModalSave = async (updateData) => {
    // updateData could be: { price }, { image_url }, { is_favorite }, { stock }, etc.
    // We get the actual field name from the payload key:
    const field = Object.keys(updateData)[0];
    let value = updateData[field];
  
    // Coerce numbers
    if (field === 'price') value = Number(value);
    if (field === 'stock') value = Math.max(0, Number(value) || 0);
    if (field === 'is_favorite') value = Number(value) === 1 ? 1 : 0;
  
    // Enforce the "max 8 favorites" rule for bulk mark-as-favorite
    let targetIds = [...selected];
    if (field === 'is_favorite' && value === 1) {
      const cache = queryClient.getQueryData(['products', { sortOrder }])
        || queryClient.getQueryData(['products']); // fallback if your key differs
      const list = cache?.products || products;
      const currentFavCount = list.filter(p => p.is_favorite === 1).length;
  
      const remaining = Math.max(0, 8 - currentFavCount);
      if (remaining <= 0) {
        alert('❌ You already have 8 favorite products.');
        return;
      }
      if (targetIds.length > remaining) {
        const allowed = targetIds.slice(0, remaining);
        const skipped = targetIds.slice(remaining);
        targetIds = allowed;
        alert(`Only ${remaining} products were marked favorite (max 8). Skipped: ${skipped.length}`);
      }
    }
  
    const payload = { [field]: value };
  
    // ---- Optimistic update in admin table (React Query) ----
    await queryClient.cancelQueries({ queryKey: ['products', { sortOrder }] });
    const prevWithKey = queryClient.getQueryData(['products', { sortOrder }]);
    const prevFallback = queryClient.getQueryData(['products']);
    const previousData = prevWithKey ?? prevFallback;
  
    const applyOptimistic = (old) => {
      if (!old?.products) return old;
      return {
        ...old,
        products: old.products.map(p =>
          targetIds.includes(p.id) ? { ...p, [field]: value } : p
        ),
      };
    };
  
    // try keyed first, then fallback
    if (prevWithKey) {
      queryClient.setQueryData(['products', { sortOrder }], (old) => applyOptimistic(old));
    } else if (prevFallback) {
      queryClient.setQueryData(['products'], (old) => applyOptimistic(old));
    }
  
    try {
      // ---- Persist to server for each selected id ----
      await Promise.all(
        targetIds.map(async (id) => {
          const r = await fetch(`/api/admin/manage_products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          });
      
          const text = await r.text(); // read body regardless
          if (!r.ok) {
            throw new Error(`Update failed for id=${id} — ${r.status} ${text}`);
          }
          // if your API returns JSON, parse it
          try { return JSON.parse(text); } catch { return null; }
        })
      );
      
  
      // ---- Update storefront Redux immediately (no reload) ----
      const patches = targetIds.map(id => ({ id, [field]: value }));
      dispatch(upsertProductsInStore(patches));
  
      // Optional: ensure cache = DB by refetching (you can keep this or remove)
      // await queryClient.invalidateQueries({ queryKey: ['products', { sortOrder }] });
      // await queryClient.refetchQueries({ queryKey: ['products', { sortOrder }] });
  
      setIsModalOpen(false);
      setSelected([]);
      alert('Bulk update successful!');
    } catch (err) {
      console.error('❌ Bulk update failed:', err);
      // ---- Rollback admin table cache on error ----
      if (prevWithKey) {
        queryClient.setQueryData(['products', { sortOrder }], previousData);
      } else if (prevFallback) {
        queryClient.setQueryData(['products'], previousData);
      }
      alert('Failed to apply bulk update.');
    }
  };
  
  
  if (isLoading) return <div>Loading products...</div>;
  if (error) return <div>Error loading products</div>;

  return (
    <div className="p-4 bg-white shadow-lg rounded-md">
      <h2 className="text-xl font-semibold mb-4">Product List</h2>
      {selected.length > 0 && (
        <BulkActions
          selected={selected}
          onBulkDelete={handleBulkDelete}
          onBulkActivate={(isActive) => {
            selected.forEach(id => {
              toggleActiveMutation({ id, isActive });
            });
            setSelected([]); // clear after bulk action
          }}
          onBulkUpdate={handleBulkUpdate}
        />
      )}
      <ProductTable
        products={filteredProducts}
        selected={selected}
        expandedRows={expandedRows}
        onToggleSelect={handleToggleSelect}
        onSelectAll={handleSelectAll}
        onDelete={handleDelete}
        onToggleFavorite={handleToggleFavorite}
        onToggleRow={toggleRow}
        toggleActiveMutation={toggleActiveMutation}
      />
      {/* ✅ Place modal here */}
      <BulkUpdateModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSave={handleModalSave}
        field={updateField}
      />
    </div>
  );
};

export default ProductList;
