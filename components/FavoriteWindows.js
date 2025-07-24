"use client";
import WindowExpand from "./WindowExpand";
import { getImagePaths } from "./useFavoriteMapping";
import Link from "next/link";

export default function FavoriteWindows() {
  const favoriteItems = [1, 2, 3, 4, 5, 6, 7, 8].map((id) => {
    const { favoriteImage } = getImagePaths(id);
    return { productId: id, src: favoriteImage };
  });

  return (
    <div className="relative w-0 h-0 z-30">
      {favoriteItems.map((item, index) => {
        const angle = (index / favoriteItems.length) * 360;
        return (
          <div
            key={item.productId}
            className="absolute pointer-events-auto"
            style={{
              top: "50%",
              left: "50%",
              transform: `translate(-50%, -50%) rotate(${angle}deg) translateY(-33vmin) rotate(-${angle}deg)`,
              transformOrigin: "center",
            }}
          >
            <Link
              href={`/products#favorite-${item.productId}`}
              scroll={true}
              aria-label={`Go to favorite product ${item.productId}`}
            >
              <WindowExpand
                productId={item.productId}
                src={item.src}
                delay={index * 120}
                size={115}
                alt={`Favorite product ${item.productId}`}
              />
            </Link>
          </div> // ✅ Properly closed this div here
        );
      })}
    </div>
  );
}










