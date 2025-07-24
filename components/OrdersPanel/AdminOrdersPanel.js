// components/AdminOrdersPanel.js
import { useState, useEffect } from 'react';
import axios from 'axios';
import SearchBar from './SearchBar';
import OrderTable from './OrderTable';
import OrderCard from './OrderCard';

export default function AdminOrdersPanel() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [filteredOrders, setFilteredOrders] = useState([]);
    const [expandedRowId, setExpandedRowID] = useState(null);

    const toggleExpand = (id) => {
        setExpandedRowID(prev => (prev === id ? null : id));
    }

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
        <div className="font-inter p-6 max-w-6xl mx-auto">
            <div className="flex justify-between items-center mb-6">
                <h1 className="text-2xl font-bold font-title">Admin Orders Panel</h1>
                <SearchBar search={search} setSearch={setSearch} />
            </div>

            {filteredOrders.length === 0 ? (
                <p>No matching orders found.</p>
            ) : (
                <>
                    {/* Card layout for mobile */}
                    <div className="grid gap-4 lg:hidden">
                        {filteredOrders.map((order) => (
                            <OrderCard key={order.id} order={order} />
                        ))}
                    </div>

                    {/* Table layout for desktop */}
                    <OrderTable
                        orders={filteredOrders}
                        toggleExpand={toggleExpand}
                        expandedRowId={expandedRowId}
                    />
                </>
            )}
        </div>
    );
}
