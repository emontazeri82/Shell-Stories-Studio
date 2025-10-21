// pages/admin/admin_inventory/index.js
import { useState } from 'react';
import { getServerSession } from 'next-auth'; // 'next-auth/next' also fine
import { authOptions } from '@/pages/api/auth/[...nextauth]';
import ProductList from '@/components/admin_dashboard/ProductList';
import ProductSearch from '@/components/admin_dashboard/ProductSearch';
import { useRouter } from 'next/router';

export async function getServerSideProps(context) {
  const session = await getServerSession(context.req, context.res, authOptions);

  const role = String(session?.user?.role || '').toUpperCase();
  if (!session || role !== 'ADMIN') {
    return {
      redirect: {
        destination: `/admin/login?callbackUrl=${encodeURIComponent(context.resolvedUrl || '/admin/admin_inventory')}`,
        permanent: false,
      },
    };
  }

  // (Optional) prevent caching of protected page
  context.res.setHeader('Cache-Control', 'no-store');

  return { props: { /* you don't need to send session; NextAuth provides it client-side if needed */ } };
}

export default function AdminInventoryPage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState('');
  const [sortOrder, setSortOrder] = useState('created_at_desc');

  return (
    <div className="p-8">
      <h1 className="text-3xl font-semibold mb-4">📦 Product Dashboard</h1>

      <div className="mb-4 flex gap-3 justify-end">
        <button
          onClick={() => router.push('/admin/admin_inventory/new')}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
        >
          ➕ Create New Product
        </button>

        <select
          value={sortOrder}
          onChange={(e) => setSortOrder(e.target.value)}
          className="p-2 border rounded"
        >
          <option value="created_at_desc">Newest</option>
          <option value="created_at_asc">Oldest</option>
          <option value="price_asc">Price: Low to High</option>
          <option value="price_desc">Price: High to Low</option>
          <option value="name_asc">Name: A–Z</option>
          <option value="name_desc">Name: Z–A</option>
          <option value="stock_desc">Stock: High to Low</option>
        </select>
      </div>

      <ProductSearch value={searchQuery} onChange={setSearchQuery} />
      <div className="mt-6">
        <ProductList searchQuery={searchQuery} sortOrder={sortOrder} />
      </div>
    </div>
  );
}


