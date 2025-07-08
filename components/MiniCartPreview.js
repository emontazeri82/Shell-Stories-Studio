"use client";

import { useSelector } from "react-redux";
import Image from "next/image";
import Link from "next/link";

export default function MiniCartPreview({ onCartClick }) {
    const items = useSelector((state) => state.cart.items);

    return (
        <div className="w-64 bg-white border shadow-lg rounded-lg p-4 space-y-2 relative z-50">
            <div className="absolute -top-2 right-6 w-4 h-4 bg-white rotate-45 shadow -z-10" />

                {items.length === 0 ? (
                <p className="text-sm text-gray-500">Your cart is empty.</p>
            ) : (
                <>
                    {items.slice(0, 2).map((item) => (
                        <div key={item.id} className="flex items-center gap-3">
                            <Image
                                src={item.image_url}
                                alt={item.name}
                                width={50}
                                height={50}
                                className="rounded"
                            />
                            <div>
                                <p className="text-sm font-medium text-gray-800">{item.name}</p>
                                <p className="text-sm text-gray-500">${item.price.toFixed(2)}</p>
                            </div>
                        </div>
                    ))}
                    <button
                        onClick={onCartClick}
                        className="text-indigo-600 text-sm block mt-2 hover:underline"
                    >
                        View Full Cart →
                    </button>
                </>
            )}
        </div>
    );
}
