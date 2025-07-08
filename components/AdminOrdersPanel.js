// components/AdminOrdersPanel.js
import { useState, useEffect } from 'react';
import axios from 'axios';

export default function AdminOrdersPanel() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filteredOrders, setFilteredOrders] = useState([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await axios.get('/api/admin/orders');
        setOrders(res.data);
        setFilteredOrders(res.data);
      } catch (err) {
        console.error('Failed to fetch orders:', err);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, []);

  useEffect(() => {
    if (!search.trim()) {
      setFilteredOrders(orders);
    } else {
      const q = search.toLowerCase();
      setFilteredOrders(
        orders.filter(
          (o) =>
            o.email?.toLowerCase().includes(q) ||
            o.customer_name?.toLowerCase().includes(q) ||
            o.tracking_number?.toLowerCase().includes(q)
        )
      );
    }
  }, [search, orders]);

  if (loading) return <p className="p-4">Loading orders...</p>;

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Admin Orders Panel</h1>
        <input
          type="text"
          placeholder="Search by email, name, or tracking..."
          className="border p-2 rounded w-80"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {filteredOrders.length === 0 ? (
        <p>No matching orders found.</p>
      ) : (
        <table className="w-full border text-sm">
          <thead>
            <tr className="bg-gray-200">
              <th className="p-2">Order ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Total</th>
              <th>Status</th>
              <th>Tracking</th>
              <th>Date</th>
            </tr>
          </thead>
          <tbody>
            {filteredOrders.map((o) => (
              <tr key={o.id} className="border-t">
                <td className="p-2">{o.id}</td>
                <td>{o.email}</td>
                <td>{o.customer_name || '-'}</td>
                <td>${o.total_price.toFixed(2)}</td>
                <td>{o.delivered_status}</td>
                <td>{o.tracking_number || 'N/A'}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
