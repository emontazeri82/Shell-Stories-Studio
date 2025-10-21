"use client";

export default function FavoriteCardInfo({ product }) {
  return (
    <div className="p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
        <span className="text-sm font-medium text-indigo-600">
          ${Number(product.price || 0).toFixed(2)}
        </span>
      </div>
      {product.description ? (
        <p className="text-xs text-zinc-500 mt-1 line-clamp-2">
          {product.description}
        </p>
      ) : null}
    </div>
  );
}


