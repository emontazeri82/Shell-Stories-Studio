// components/OrderTable.js
import React from 'react';
import OrderDetails from './OrderDetails';

export default function OrderTable({ orders, toggleExpand, expandedRowId }) {
  return (
    <div className="hidden md:block w-full overflow-x-hidden">
      <table className="w-full min-w-[1200px] border text-sm">
        <colgroup>
          <col className="w-[70px]" />    {/* Order ID */}
          <col className="w-[200px]" />   {/* Email */}
          <col className="w-[140px]" />   {/* Name */}
          <col className="w-[130px]" />   {/* Phone */}
          <col className="w-[260px]" />   {/* Shipping */}
          <col className="w-[110px]" />   {/* Total */}
          <col className="w-[120px]" />   {/* Status */}
          <col className="w-[160px]" />   {/* Delivery */}
          <col className="w-[120px]" />   {/* Payment */}
          <col className="w-[140px]" />   {/* Tracking */}
          <col className="w-[120px]" />   {/* Date */}
          <col className="w-[90px]" />    {/* Actions */}
        </colgroup>
        
        <thead className="font-poppins sticky top-0 z-10 bg-gray-200 shadow-sm">
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
              <tr className="border-t even:bg-gray-50 hover:bg-indigo-50/40 transition">
                <td className="p-2">{o.id}</td>
                <td className="max-w-[200px] truncate" title={o.email}>{o.email}</td>
                <td>{o.customer_name || '-'}</td>

                <td className="hidden xl:table-cell">{o.phone || '-'}</td>

                <td className="max-w-[260px] truncate">
                  {o.address_1 ? (
                    <span title={`${o.address_1}, ${o.city}, ${o.state} ${o.postal_code}`}>
                      {o.address_1}, {o.city}
                    </span>
                  ) : (
                    <span className="italic text-gray-400">Pickup</span>
                  )}
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
                    className="text-indigo-600 hover:text-indigo-800 font-semibold text-xs"
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

