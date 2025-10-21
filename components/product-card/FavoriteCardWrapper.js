"use client";

export default function FavoriteCardWrapper({
  productId,
  onClick,
  isHighlighted,
  children,
}) {
  return (
    <div
      id={`favorite-${productId}`}
      role="button"
      tabIndex={0}
      onClick={onClick}
      onKeyDown={(e) => {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          onClick?.();
        }
      }}
      className={`group rounded-xl border bg-white/70 dark:bg-zinc-900/70 backdrop-blur-sm
        hover:shadow-lg transition overflow-hidden cursor-pointer outline-none
        ${isHighlighted ? "ring-2 ring-indigo-500" : "ring-1 ring-black/5"}`}
    >
      {children}
    </div>
  );
}

