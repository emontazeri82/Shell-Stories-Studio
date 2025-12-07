import { useState } from "react";

export default function OrderItemsList({ items }) {
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!items || items.length === 0) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-300">
        No items found for this order.
      </p>
    );
  }

  return (
    <div className="space-y-3">

      {/* IMAGE PREVIEW MODAL */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
          onClick={() => setPreviewUrl(null)}
        >
          <img
            src={previewUrl}
            alt="Preview"
            className="max-w-[80%] max-h-[80%] rounded-lg shadow-2xl border-4 border-white object-contain"
          />
        </div>
      )}

      {items.map((item) => (
        <div
          key={item.product_id}
          className="flex justify-start items-center p-3 bg-gray-50 dark:bg-gray-700 rounded border dark:border-gray-600 gap-6"
        >
          {/* LEFT SIDE — IMAGE + NAME */}
          <div className="flex items-center gap-3">
            <img
              src={item.image_url || "/placeholder.png"}
              alt={item.product_name}
              onClick={() => setPreviewUrl(item.image_url)}
              className="w-12 h-12 rounded object-cover border dark:border-gray-500 cursor-pointer hover:scale-105 transition"
            />

            <div>
              <p className="font-medium text-gray-800 dark:text-gray-100">
                {item.product_name}
              </p>

              <p className="text-xs text-gray-600 dark:text-gray-300">
                Quantity: {item.quantity}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE — PRICE + SUBTOTAL */}
          <div className="text-right">
            <p className="text-gray-800 dark:text-gray-100">
              ${item.price}
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-300">
              Subtotal: ${(item.quantity * item.price).toFixed(2)}
            </p>
          </div>
        </div>
      ))}
    </div>
  );
}

  