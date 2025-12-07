import OrderItemsList from "./OrderItemsList";
import ShippingActions from "./ShippingActions";

export default function OrderDetails({ order }) {
  return (
    <div className="bg-gray-50 text-sm">

      {/* HEADER WITH ACTION BUTTON */}
      <div className="flex items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Order Details
        </h3>

        <div className="ml-40"> {/* small right push */}
          <ShippingActions order={order} />
        </div>
      </div>


      {/* ORDER INFO */}
      <div className="mb-4 space-y-1">
        <div><strong>Phone:</strong> {order.phone || "N/A"}</div>
        <div><strong>Address:</strong> {order.shipping_address || "N/A"}</div>
        <div><strong>Billing Address:</strong> {order.billing_address || "N/A"}</div>
        <div><strong>Payment Status:</strong> {order.payment_status || "Unknown"}</div>
        <div><strong>Payment Method:</strong> {order.payment_method || "N/A"}</div>
        <div><strong>Delivery Method:</strong> {order.delivery_method || "standard"}</div>
        <div><strong>Shipped At:</strong> {order.shipped_at || "N/A"}</div>
        <div><strong>Delivered At:</strong> {order.delivered_at || "N/A"}</div>
        <div><strong>Email:</strong> {order.email || "N/A"}</div>
      </div>

      {/* ITEMS LIST */}
      <div className="mt-4 border-t pt-4">
        <h3 className="font-semibold text-gray-800 mb-2">
          Items in This Order
        </h3>
        <OrderItemsList items={order.items} />
      </div>

    </div>
  );
}

