// components/OrderTable.js
import React from 'react';
import OrderDetails from './OrderDetails';

export default function OrderTable({ orders, toggleExpand, expandedRowId }) {
  return (
    <div className="hidden md:block overflow-x-auto">
      <table className="w-full min-w-[1200px] border text-sm">
        <thead className="font-poppins">
          <tr className="bg-gray-200">
            <th className="p-2">Order ID</th>
            <th>Email</th>
            <th>Name</th>
            <th className='hidden xl:table-cell'>Phone</th>
            <th>Shipping Address</th>
            <th>Total</th>
            <th>Status</th>
            <th>Delivery</th>
            <th>Payment</th>
            <th>Tracking</th>
            <th>Date</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody className="font-inter">
          {orders.map((o) => (
            <React.Fragment key={o.id}>
              {/* MAIN ROW */}
              <tr className="border-t">
                <td className="p-2">{o.id}</td>
                <td className="max-w-[180px] truncate" title={o.email}>{o.email}</td>
                <td>{o.customer_name || '-'}</td>

                <td className="hidden xl:table-cell">{o.phone || '-'}</td>

                <td className="max-w-[200px] truncate" title={o.shipping_address}>
                  {o.shipping_address}
                </td>

                <td>${o.total_price.toFixed(2)}</td>

                <td>{o.shipping_status || "Pending"}</td>

                <td>
                  <span
                    className={`px-2 py-1 text-xs rounded-full
                      ${o.delivery_method === 'express'
                        ? 'bg-yellow-100 text-yellow-800'
                        : o.delivery_method === 'pickup'
                          ? 'bg-green-100 text-green-800'
                          : o.delivery_method === 'local'
                            ? 'bg-blue-100 text-blue-800'
                            : 'bg-gray-100 text-gray-800' // standard shipping default
                      }
                    `}
                  >
                    {o.delivery_method === 'standard'
                      ? 'Standard Shipping'
                      : o.delivery_method === 'express'
                        ? 'Express Shipping'
                        : o.delivery_method === 'local'
                          ? 'Local Delivery'
                          : o.delivery_method === 'pickup'
                            ? 'Store Pickup'
                            : o.delivery_method}
                  </span>
                </td>


                <td>{o.payment_status || 'Unknown'}</td>
                <td>{o.tracking_number || 'N/A'}</td>
                <td>{new Date(o.created_at).toLocaleDateString()}</td>

                <td>
                  <button
                    onClick={() => toggleExpand(o.id)}
                    className="text-indigo-600 hover:underline text-xs"
                  >
                    {expandedRowId === o.id ? "Hide" : "view"}
                  </button>
                </td>
              </tr>

              {/* EXPANDED ROW */}
              {expandedRowId === o.id && (
                <tr>
                  <td colSpan="12" className="bg-gray-50 p-4">
                    <OrderDetails order={o} />
                  </td>
                </tr>
              )}
            </React.Fragment>
          ))}
        </tbody>
      </table>
    </div>
  );
}

