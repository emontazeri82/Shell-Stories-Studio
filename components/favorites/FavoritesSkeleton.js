// components/favorites/FavoritesSkeleton.jsx
"use client";
export default function FavoritesSkeleton({ count = 4 }) {
  return Array.from({ length: count }).map((_, i) => (
    <div
      key={`sk-${i}`}
      className="snap-start min-w-[220px] rounded-xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/60 dark:bg-zinc-900/60 p-3 backdrop-blur animate-pulse"
    >
      <div className="h-28 rounded-lg bg-zinc-200/60 dark:bg-zinc-800/60" />
      <div className="mt-3 h-4 w-2/3 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
      <div className="mt-2 h-3 w-1/3 bg-zinc-200/60 dark:bg-zinc-800/60 rounded" />
      <div className="mt-2 h-8 w-full bg-zinc-200/60 dark:bg-zinc-800/60 rounded-lg" />
    </div>
  ));
}
