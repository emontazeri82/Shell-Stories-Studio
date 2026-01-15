"use client";

export default function FavoriteCardInfo({ product }) {
  console.log("PUBLIC PRODUCT:", product);

  const price = Number(product.price || 0);

  const hasDiscount =
    Number(product.discount_active) === 1 &&
    Number(product.discount_percent) > 0;

  const discountedPrice = hasDiscount
    ? (
        price -
        (price * Number(product.discount_percent)) / 100
      ).toFixed(2)
    : null;

  return (
    <div className="p-6 space-y-2">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="font-medium text-lg tracking-tight line-clamp-1">
          {product.name}
        </h3>

        <div className="flex flex-col items-end">
          {hasDiscount ? (
            <>
              <span className="text-sm text-gray-400 line-through">
                ${price.toFixed(2)}
              </span>
              <span className="text-red-600 font-semibold">
                ${discountedPrice}
              </span>
            </>
          ) : (
            <span className="text-indigo-600 font-semibold">
              ${price.toFixed(2)}
            </span>
          )}
        </div>
      </div>

      {product.description ? (
        <p className="text-sm text-zinc-600 line-clamp-2">
          {product.description}
        </p>
      ) : null}
    </div>
  );
}


