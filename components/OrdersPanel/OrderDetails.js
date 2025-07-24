// components/OrderDetails.js
export default function OrderDetails({ order }) {
    return (
      <tr className="bg-gray-50 text-sm">
        <td colSpan={8} className="p-4 text-gray-700">
          <div><strong>Phone:</strong> {order.phone || 'N/A'}</div>
          <div><strong>Address:</strong> {order.shipping_address || 'N/A'}</div>
          <div><strong>Payment Status:</strong> {order.payment_status || 'Unknown'}</div>
          <div><strong>Billing Address:</strong> {order.billing_address || 'N/A'}</div>
          <div><strong>Payment Method:</strong> {order.payment_method || 'N/A'}</div>
          <div><strong>Delivery Method:</strong> {order.delivery_method || 'standard'}</div>
          <div><strong>Shipped At:</strong> {order.shipped_at || 'N/A'}</div>
          <div><strong>Delivered At:</strong> {order.delivered_at || 'N/A'}</div>
          <div><strong>Email:</strong> {order.email || 'N/A'}</div>
          {/* Add more details if needed */}
        </td>
      </tr>
    );
  }
  