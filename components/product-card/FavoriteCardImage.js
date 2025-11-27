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
      className={`relative aspect-square overflow-hidden max-w-[380px] mx-auto mask-luxury ${
        highlightFromCenter ? "animate-[pop_600ms_ease-out_1]" : ""
      }`}
    >
      <Image
        src={src}
        alt={product?.name || "Product image"}
        fill
        sizes="(min-width: 768px) 33vw, 100vw"
        className="object-cover object-center transition-transform duration-700 ease-[cubic-bezier(.19,1,.22,1)] group-hover:scale-110"
        priority={false}
      />
    </div>
  );
}

