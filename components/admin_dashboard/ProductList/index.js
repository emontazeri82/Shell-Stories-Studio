// components/admin_dashboard/ProductList/index.js
import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'next/router';
import { toggleActiveStatus } from '@/lib/adminApi/activationToggle';
import { fetchProducts } from '@/lib/adminApi/productFetchers';
import { deleteProduct } from '@/lib/adminApi/productActions';
import { toggleFavorite } from '@/lib/adminApi/favoriteToggle';

import BulkUpdateModal from './BulkUpdateModal';
import BulkActions from './BulkActions';
import ProductTable from './ProductTable';

const ProductList = ({ searchQuery, sortOrder }) => {
  const queryClient = useQueryClient();
  const [expandedRows, setExpandedRows] = useState({});
  const [selected, setSelected] = useState([]);
  const [updateField, setUpdateField] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
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
    if (!isFavorite && count >= 8) return alert('❌ Max 8 favorite products.');
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
    try {
      const field = Object.keys(updateData)[0];
      let value = updateData[field];
  
      // Normalize numbers
      if (field === 'price' || field === 'stock') {
        value = Number(value);
      }
  
      const payload = { [field]: value };
  
      await Promise.all(
        selected.map(id =>
          fetch(`/api/admin/manage_products/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload),
          })
        )
      );
  
      alert('Bulk update successful!');
      await queryClient.invalidateQueries({ queryKey: ['products'] });
      await queryClient.refetchQueries({ queryKey: ['products'] });

      setIsModalOpen(false);
      setSelected([]);
    } catch (err) {
      console.error('❌ Bulk update failed:', err);
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
