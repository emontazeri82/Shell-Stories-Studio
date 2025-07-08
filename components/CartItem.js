// components/CartItem.js
"use client";

import Image from "next/image";
import { useDispatch } from "react-redux";
import {
  incrementQuantity,
  decrementQuantity,
  removeFromCart,
} from "@/redux/slices/cartSlice";
import { XMarkIcon } from "@heroicons/react/24/outline";

export default function CartItem({ item }) {
  const dispatch = useDispatch();

  return (
    <div className="flex items-start gap-4 py-4 border-b border-gray-200 dark:border-gray-700">
      <div className="w-24 h-24 relative rounded overflow-hidden">
        <Image
          src={item.image_url}
          alt={item.name}
          fill
          className="object-cover"
        />
      </div>

      <div className="flex-1">
        <div className="flex justify-between items-start">
          <div>
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              {item.name}
            </h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">${item.price.toFixed(2)}</p>
          </div>
          <button
            onClick={() => dispatch(removeFromCart(item.id))}
            className="text-gray-400 hover:text-red-500 dark:text-gray-500 dark:hover:text-red-400"
            aria-label="Remove item"
          >
            <XMarkIcon className="h-5 w-5" />
          </button>
        </div>

        <div className="flex items-center gap-2 mt-2">
          <button
            onClick={() => dispatch(decrementQuantity(item.id))}
            disabled={item.quantity <= 1}
            className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 disabled:opacity-50
                        dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            -
          </button>
          <span className="w-8 text-center">{item.quantity}</span>
          <button
            onClick={() => dispatch(incrementQuantity(item.id))}
            className="px-2 py-1 bg-gray-200 text-gray-800 rounded hover:bg-gray-300
                       dark:bg-gray-700 dark:text-gray-100 dark:hover:bg-gray-600"
          >
            +
          </button>
        </div>
      </div>
    </div>
  );
}
