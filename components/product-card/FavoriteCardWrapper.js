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
      className={`group rounded-2xl bg-gradient-to-b from-white via-amber-50/40 to-white
        dark:from-zinc-900 dark:via-zinc-800/40 dark:to-zinc-900
        backdrop-blur-sm 
        shadow-[0_10px_30px_rgba(0,0,30,0.12)]
        hover:shadow-[0_20px_40px_rgba(0,0,30,0.16)]
        /* ⭐ PREMIUM ANIMATIONS */
        hover:-translate-y-1
        active:scale-95
        group-hover:[transform:rotateX(2deg)_rotateY(-2deg)]
        transition-transform duration-700 ease-[cubic-bezier(.19,1,.22,1)]

        cursor-pointer overflow-hidden outline-none
        ${isHighlighted ? "ring-2 ring-indigo-500" : "ring-1 ring-black/5"}
      `}
    >
      {children}
    </div>
  );
}

