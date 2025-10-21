"use client";

import Image from "next/image";

export default function FavoriteCardImage({ product, highlightFromCenter }) {
  // Prefer primary media (if your /api/products added it), else legacy image_url
  const src =
    product?.primaryMedia?.url ||
    product?.image_url ||
    "/placeholder.png";

  return (
    <div
      className={`relative aspect-square overflow-hidden ${
        highlightFromCenter ? "animate-[pop_600ms_ease-out_1]" : ""
      }`}
    >
      <Image
        src={src}
        alt={product?.name || "Product image"}
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover transition-transform duration-300 group-hover:scale-105"
        priority={false}
      />
    </div>
  );
}

