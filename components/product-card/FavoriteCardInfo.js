"use client";

export default function FavoriteCardInfo({ product }) {
  return (
    /*<div className="p-3">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="font-semibold line-clamp-1">{product.name}</h3>
        <span className="text-sm font-medium text-indigo-600">
          ${Number(product.price || 0).toFixed(2)}
        </span>
      </div>
      {product.description ? (
        <p className="text-sm text-zinc-600 line-clamp-2">
          {product.description}
        </p>
      ) : null}
    </div>*/
    <div className="p-6 space-y-2">
      <div className="flex items-baseline justify-between">
        <h3 className="font-medium text-lg tracking-tight">{product.name}</h3>
        <span className="text-indigo-600 font-semibold">${product.price}</span>
      </div>
      {product.description ? (
        <p className="text-sm text-zinc-600 line-clamp-2">
          {product.description}
        </p>
      ) : null}
    </div>
  );
}


