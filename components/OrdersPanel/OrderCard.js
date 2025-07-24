// components/OrderCard.js
"use client";

import { format } from "date-fns";

export default function OrderCard({ order }) {
  return (
    <div className="bg-white dark:bg-gray-800 shadow-md rounded-lg p-4 border dark:border-gray-700">
      <div className="flex justify-between items-center mb-2">
        <h2 className="font-semibold text-gray-800 dark:text-gray-100">
          Order #{order.id}
        </h2>
        <span className="text-sm text-gray-500 dark:text-gray-400">
          {format(new Date(order.created_at), "MM/dd/yyyy")}
        </span>
      </div>

      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Customer:</span> {order.customer_name || "-"}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Email:</span> {order.email}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Phone:</span> {order.phone || "N/A"}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200 truncate">
        <span className="font-medium">Shipping:</span> {order.shipping_address || "N/A"}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Total:</span> ${order.total_price.toFixed(2)}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Status:</span> {order.delivered_status}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Payment:</span> {order.payment_status || "Unknown"}
      </p>
      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Delivery:</span> {order.delivery_method || "standard"}
      </p>

      <p className="text-sm text-gray-700 dark:text-gray-200">
        <span className="font-medium">Tracking:</span> {order.tracking_number || "N/A"}
      </p>

      <button
        className="mt-4 w-full text-indigo-600 hover:underline text-sm font-semibold"
        onClick={() => alert(`Viewing details for Order #${order.id}`)}
      >
        View Details
      </button>
    </div>
  );
}
