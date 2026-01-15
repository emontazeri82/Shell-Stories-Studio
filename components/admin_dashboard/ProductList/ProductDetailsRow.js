"use client";
import React, { useMemo } from "react";

export default function ProductDetailsRow({ product }) {
  if (!product) {
    console.warn("[ProductDetailsRow] ⚠️ No product data provided");
    return null;
  }

  // 🧩 Normalize media list — handles async updates gracefully
  const mediaItems = useMemo(() => {
    if (!product?.media) return [];
    if (!Array.isArray(product.media)) return [];
    return product.media.filter((m) => m?.secure_url || m?.url);
  }, [product.media]);

  console.log("[ProductDetailsRow] 🔍 Render:", {
    id: product.id,
    mediaCount: mediaItems.length,
  });

  return (
    <tr className="bg-gray-50">
      <td colSpan="7" className="p-4">
        {/* 📝 Description */}
        <p className="text-gray-700 text-sm">
          <strong>Description:</strong>{" "}
          {product.description || "No description provided."}
        </p>
        {/* 💸 Discount Info */}
        {Number(product.discount_active) === 1 && (
          <p className="mt-2 text-sm text-red-600 font-semibold">
            Discount Price: ${product.discount_price}
          </p>
        )}

        {/* 🖼 Media Gallery */}
        <div className="mt-3">
          <strong>Media:</strong>
          <div className="mt-2 flex flex-wrap gap-3">
            {mediaItems.length > 0 ? (
              mediaItems.map((m, idx) => {
                const kind = (m.kind || m.resource_type || "").toLowerCase();
                const url = m.secure_url || m.url;
                const isPrimary =
                  Number(m.is_primary) === 1 ||
                  m.sort_order === 0 ||
                  idx === 0;

                if (kind === "video") {
                  return (
                    <video
                      key={m.public_id || idx}
                      src={url}
                      controls
                      muted
                      playsInline
                      className={`h-24 w-32 border rounded-md object-cover ${isPrimary
                          ? "border-2 border-blue-500"
                          : "border border-gray-300"
                        }`}
                    />
                  );
                }

                return (
                  <img
                    key={m.public_id || idx}
                    src={url}
                    alt={m.public_id || product.name || "media"}
                    className={`h-24 w-24 object-cover rounded-md ${isPrimary
                        ? "border-2 border-blue-500"
                        : "border border-gray-300"
                      }`}
                  />
                );
              })
            ) : product.image_url ? (
              <img
                src={product.image_url}
                alt={product.name || "Product image"}
                className="h-24 w-24 border border-gray-300 object-cover rounded-md"
              />
            ) : (
              <div className="h-24 w-24 border border-gray-300 bg-gray-100 flex items-center justify-center text-sm text-gray-500 rounded-md">
                No media
              </div>
            )}
          </div>
        </div>
      </td>
    </tr>
  );
}

