import axios from "axios";
import { useState } from "react";

export default function ShippingActions({ order }) {
  const [loading, setLoading] = useState(false);

  const updateStatus = async (action) => {
    try {
      setLoading(true);

      await axios.patch("/api/admin/orders/update_status", {
        orderId: order.id,
        action,
      });

      alert(`Order updated: ${action}`);
      window.location.reload();

    } catch (err) {
      console.error("❌ Update failed:", err);
      alert("Error updating order");
    } finally {
      setLoading(false);
    }
  };

  /* ------------------------------------------------------------------
      LOGIC MATRIX
      --------------------------------------------------------------
      delivery_method = "standard" or "express"
        → First show “Mark as Shipped”
        → After that, show “Mark as Delivered”

      delivery_method = "local"
        → Only show “Mark as Delivered”

      delivery_method = "pickup"
        → Only show “Mark as Picked Up”
    ------------------------------------------------------------------ */

  const isShipped = order.shipping_status === "Shipped";
  const isDelivered = order.shipping_status === "Delivered";

  return (
    <div className="flex gap-3">

      {/* -----------------------------------------------------------
         STANDARD or EXPRESS SHIPPING
         ----------------------------------------------------------- */}
      {(order.delivery_method === "standard" ||
        order.delivery_method === "express") && (
        <>
          {!isShipped && !isDelivered && (
            <button
              onClick={() => updateStatus("ship")}
              disabled={loading}
              className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
            >
              Mark as Shipped
            </button>
          )}

          {isShipped && !isDelivered && (
            <button
              onClick={() => updateStatus("deliver")}
              disabled={loading}
              className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
            >
              Mark as Delivered
            </button>
          )}
        </>
      )}

      {/* -----------------------------------------------------------
         LOCAL DELIVERY
         ----------------------------------------------------------- */}
      {order.delivery_method === "local" && !isDelivered && (
        <button
          onClick={() => updateStatus("deliver")}
          disabled={loading}
          className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
        >
          Mark as Delivered
        </button>
      )}

      {/* -----------------------------------------------------------
         PICKUP ORDERS
         ----------------------------------------------------------- */}
      {order.delivery_method === "pickup" &&
        !isDelivered && (
          <button
            onClick={() => updateStatus("pickup")}
            disabled={loading}
            className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50"
          >
            Mark as Picked Up
          </button>
        )}
    </div>
  );
}
