// pages/cart/index.js
import Head from "next/head";
import Link from "next/link";
import { useSelector } from "react-redux";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import CartItem from "@/components/CartItem";
import { useMemo, useState } from "react";
import {
  LockClosedIcon,
  TruckIcon,
  ShieldCheckIcon,
  TagIcon,
} from "@heroicons/react/24/outline";
import dynamic from "next/dynamic";
import { SHOW_FREE_SHIP_BAR, FREE_SHIP_THRESHOLD } from "@/lib/constant";

export default function CartPage() {
  const { items } = useSelector((s) => s.cart);
  const prefersReducedMotion = useReducedMotion();
  const FavoritesRail = dynamic(() => import("@/components/favorites/FavoritesRail"), { ssr: false });

  const subtotal = useMemo(
    () =>
      items.reduce(
        (sum, i) => sum + Number(i.price || 0) * Number(i.quantity || 0),
        0
      ),
    [items]
  );
  const fmt = useMemo(
    () => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD" }),
    []
  );


  // --- Settings (tweak to taste)
  //const FREE_SHIP_THRESHOLD = 120;
  const remainingToFree = Math.max(0, FREE_SHIP_THRESHOLD - subtotal);
  const freeShipProgress = Math.min(100, (subtotal / FREE_SHIP_THRESHOLD) * 100);

  // Simple promo UX (local only; wire to backend later)
  const [promo, setPromo] = useState("");
  const [appliedPromos, setAppliedPromos] = useState([]);
  const discount = useMemo(() => {
    // playful demo: "SHELL10" → 10% off, "WELCOME15" → 15% off
    const codes = new Set(appliedPromos.map((c) => c.toUpperCase()));
    if (codes.has("WELCOME15")) return subtotal * 0.15;
    if (codes.has("SHELL10")) return subtotal * 0.1;
    return 0;
  }, [appliedPromos, subtotal]);

  const total = Math.max(0, subtotal - discount);
  const taxesNote = "Calculated at checkout";

  const applyPromo = () => {
    const code = promo.trim().toUpperCase();
    if (!code) return;
    if (!appliedPromos.includes(code)) {
      setAppliedPromos((p) => [...p, code]);
      setPromo("");
    }
  };
  const removePromo = (code) =>
    setAppliedPromos((p) => p.filter((c) => c !== code));

  // Empty state
  if (!items.length) {
    return (
      <>
        <Head>
          <title>Your Cart — Shell Stories Studio</title>
        </Head>
        <main className="relative mx-auto max-w-3xl px-4 py-16">
          {/* Step 1 — ambient glass + dot grid */}
          <div className="pointer-events-none absolute inset-0 -z-10">
            {/* soft aurora */}
            <div className="absolute inset-x-0 -top-24 h-72 bg-[radial-gradient(60%_60%_at_50%_0%,rgba(99,102,241,0.22),rgba(236,72,153,0.12)_40%,transparent_70%)] blur-3xl" />
            {/* subtle dot grid */}
            <div className="absolute inset-0 opacity-[0.15] [background:radial-gradient(#6b7280_1px,transparent_1px)] [background-size:20px_20px]" />
          </div>

          <div className="relative rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 p-10 text-center bg-white/70 dark:bg-zinc-900/70 backdrop-blur">
            <h1 className="text-3xl font-bold mb-2">Your cart is empty</h1>
            <p className="text-zinc-600 dark:text-zinc-300 mb-6">
              Add some sparkle to your story ✨
            </p>
            <Link
              href="/"
              className="inline-block rounded-2xl px-5 py-3 font-semibold text-white
                 bg-gradient-to-r from-indigo-600 via-violet-600 to-fuchsia-600
                 shadow-[0_8px_30px_rgba(99,102,241,0.25)] ring-1 ring-white/15
                 hover:scale-[1.01] transition"
            >
              Continue shopping
            </Link>
          </div>
        </main>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Your Cart — Shell Stories Studio</title>
      </Head>

      <main className="relative mx-auto max-w-7xl px-4 py-10">
        {/* ambient gradient glow */}
        <div className="pointer-events-none absolute inset-x-0 -top-40 h-[380px] bg-gradient-to-b from-indigo-500/25 via-fuchsia-500/15 to-transparent blur-3xl" />

        {/* Step 2 — checkout stepper */}
        <nav aria-label="Checkout progress" className="relative mb-6">
          <ol className="flex items-center gap-3 text-[12px] font-inter font-medium text-zinc-600 dark:text-zinc-400">
            {/* Step 1: Cart (current) */}
            <li className="flex items-center gap-2" aria-current="step">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-600 text-white shadow-sm">
                1
              </span>
              <span>Cart</span>
            </li>

            <span className="h-[1px] w-12 bg-gradient-to-r from-indigo-500/50 to-fuchsia-500/50" />

            {/* Step 2: Shipping */}
            <li className="flex items-center gap-2 opacity-75">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                2
              </span>
              <span>Shipping</span>
            </li>

            <span className="h-[1px] w-12 bg-zinc-300/60 dark:bg-zinc-700/60" />

            {/* Step 3: Payment */}
            <li className="flex items-center gap-2 opacity-75">
              <span className="flex h-6 w-6 items-center justify-center rounded-full bg-zinc-200 dark:bg-zinc-800">
                3
              </span>
              <span>Payment</span>
            </li>
          </ol>
        </nav>

        {/* Header */}
        <div className="relative mb-8 flex items-end justify-between">
          <div>
            <h1 className="text-4xl font-bold leading-tight tracking-tight">
              Your Cart
            </h1>
            <p className="text-sm text-zinc-600 dark:text-zinc-300">
              {items.length} item{items.length > 1 ? "s" : ""}
            </p>
          </div>
          <Link
            href="/products"
            className="text-sm font-medium text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300 underline-offset-2 hover:underline"
          >
            Continue shopping
          </Link>
        </div>

        {/* Free shipping banner */}
        {SHOW_FREE_SHIP_BAR && (
          <section className="relative mb-8" aria-live="polite">
            <div className="relative rounded-2xl p-4 bg-white/70 dark:bg-zinc-900/60 ring-1 ring-white/10 shadow-sm backdrop-blur">
              {/* subtle glossy outline */}
              <div className="absolute inset-0 rounded-2xl pointer-events-none ring-1 ring-amber-300/30" />

              {/* message row */}
              <div className="flex items-center gap-2 text-sm font-medium">
                <TruckIcon
                  className={`h-5 w-5 ${remainingToFree > 0 ? "text-amber-500" : "text-emerald-500"
                    }`}
                />
                <AnimatePresence mode="wait">
                  {remainingToFree > 0 ? (
                    <motion.p
                      key="need"
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                      className="text-amber-700 dark:text-amber-300"
                    >
                      You’re{" "}
                      <span className="font-semibold">${remainingToFree.toFixed(2)}</span>{" "}
                      away from <span className="font-semibold">free shipping</span>.
                    </motion.p>
                  ) : (
                    <motion.p
                      key="ok"
                      initial={{ opacity: 0, y: prefersReducedMotion ? 0 : 6 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: prefersReducedMotion ? 0 : -6 }}
                      className="text-emerald-700 dark:text-emerald-300"
                    >
                      🎉 You’ve unlocked <span className="font-semibold">free shipping</span>!
                    </motion.p>
                  )}
                </AnimatePresence>
              </div>

              {/* progress bar (accessible) */}
              <div
                className="mt-3 relative h-2 w-full overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800"
                role="progressbar"
                aria-valuemin={0}
                aria-valuemax={FREE_SHIP_THRESHOLD}
                aria-valuenow={subtotal}
                aria-label="Progress toward free shipping"
              >
                {/* fill */}
                <motion.div
                  className={`h-full rounded-full transition-[width] duration-500 ${remainingToFree > 0
                    ? "bg-[repeating-linear-gradient(45deg,rgba(251,191,36,0.9)_0_10px,rgba(245,158,11,0.9)_10px_20px)]"
                    : "bg-gradient-to-r from-emerald-400 to-emerald-500 shadow-[0_0_0_1px_rgba(16,185,129,0.2)]"
                    }`}
                  style={{ width: `${Math.max(8, freeShipProgress)}%` }}
                  initial={{ width: 0 }}
                  animate={{ width: `${Math.max(8, freeShipProgress)}%` }}
                  transition={{ type: "tween", duration: 0.5 }}
                />

                {/* floating chip that tracks progress */}
                <motion.div
                  initial={false}
                  animate={{
                    left: `calc(${Math.max(8, freeShipProgress)}% - 22px)`,
                  }}
                  className="absolute -top-5 px-2 py-0.5 rounded-full text-[11px] font-medium
                   bg-white/80 dark:bg-zinc-900/80 backdrop-blur ring-1 ring-black/10 dark:ring-white/10
                   text-zinc-700 dark:text-zinc-200"
                >
                  {remainingToFree > 0 ? `$${Math.ceil(remainingToFree)} to go` : "Free!"}
                </motion.div>

                {/* optional shine when unlocked (prefers reduced motion respected) */}
                {!prefersReducedMotion && remainingToFree <= 0 && (
                  <>
                    <span
                      className={[
                        "pointer-events-none absolute inset-0 -translate-x-full",
                        "bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)]",
                        "[mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]",
                        "animate-[shine_2.2s_ease-in-out_infinite]",
                      ].join(" ")}
                    />
                    <style jsx>{`
                    @keyframes shine {
                      0% { transform: translateX(-120%); }
                      60% { transform: translateX(120%); }
                      100% { transform: translateX(120%); }
                    }
                 `}</style>
                  </>
                )}

              </div>
            </div>
          </section>
        )}


        {/* Main grid */}
        <div className="relative grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items */}
          <section className="lg:col-span-2 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/70 backdrop-blur p-4 sm:p-6">
            <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
              {items.map((item) => (
                <li key={item.id} className="py-4">
                  <CartItem item={item} />
                </li>
              ))}
            </ul>

            {/* curated favorites from DB + edge fade */}
            <div className="relative group/rail mt-6">
              <FavoritesRail />
              <div className="pointer-events-none absolute inset-y-0 right-0 w-10
                  bg-gradient-to-l from-white/80 dark:from-zinc-900/80 to-transparent
                  rounded-r-xl opacity-0 group-hover/rail:opacity-100 transition-opacity"></div>
            </div>

          </section>

          {/* Summary (sticky) */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-6 rounded-2xl border border-zinc-200/60 dark:border-zinc-800/60 bg-white/70 dark:bg-zinc-900/70 backdrop-blur p-4 sm:p-6 shadow-sm">
              {/* Promos */}
              <div>
                <label
                  htmlFor="promo"
                  className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 mb-1"
                >
                  Promo code
                </label>
                <div className="flex gap-2">
                  <input
                    id="promo"
                    value={promo}
                    onChange={(e) => setPromo(e.target.value)}
                    placeholder="SHELL10"
                    className="flex-1 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white/80 dark:bg-zinc-900/60 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-400"
                  />
                  <button
                    type="button"
                    onClick={applyPromo}
                    className="rounded-xl px-3 py-2 text-sm font-semibold bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700"
                  >
                    Apply
                  </button>
                </div>

                {/* Applied promo chips */}
                <div className="mt-2 flex flex-wrap gap-2">
                  {appliedPromos.map((code) => (
                    <span
                      key={code}
                      className="inline-flex items-center gap-1 rounded-full bg-emerald-100/70 dark:bg-emerald-400/10 text-emerald-700 dark:text-emerald-300 px-2 py-1 text-xs ring-1 ring-emerald-300/40"
                    >
                      <TagIcon className="h-4 w-4" />
                      {code}
                      <button
                        onClick={() => removePromo(code)}
                        className="ml-1 text-emerald-700/70 hover:text-emerald-700 dark:text-emerald-300/70 dark:hover:text-emerald-300"
                        aria-label={`Remove ${code}`}
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              </div>

              {/* Numbers */}
              <div className="mt-5 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">Subtotal</span>
                  <span className="font-semibold tabular-nums">
                    {fmt.format(subtotal)}
                  </span>
                </div>
                {discount > 0 && (
                  <div className="flex justify-between">
                    <span className="text-emerald-600 dark:text-emerald-300">
                      Discount
                    </span>
                    <span className="font-semibold tabular-nums">
                      −{fmt.format(discount)}
                    </span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">Shipping</span>
                  <span className="font-medium">
                    {remainingToFree > 0 ? "Calculated at checkout" : "Free"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-zinc-600 dark:text-zinc-300">Taxes</span>
                  <span className="font-medium">{taxesNote}</span>
                </div>
                <div className="pt-2 mt-2 border-t border-zinc-200 dark:border-zinc-800 flex justify-between text-base">
                  <span className="font-semibold">Total</span>
                  <span className="font-extrabold tabular-nums">
                    {fmt.format(total)}
                  </span>
                </div>
              </div>

              {/* Checkout CTA */}
              <div className="mt-5">
                <motion.button
                  whileHover={!prefersReducedMotion ? { scale: 1.015 } : undefined}
                  whileTap={!prefersReducedMotion ? { scale: 0.985 } : undefined}
                  className={[
                    "relative inline-flex w-full items-center justify-center gap-2 overflow-hidden",
                    "rounded-2xl px-4 py-3 font-semibold text-white",
                    "bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700",
                    "shadow-[0_8px_30px_rgba(16,185,129,0.25)] ring-1 ring-white/10",
                    "focus:outline-none focus-visible:ring-2",
                    "focus-visible:ring-emerald-400/70 dark:focus-visible:ring-emerald-300/70"
                  ].join(" ")}
                  aria-label="Proceed to checkout"
                >
                  {/* animated shine (skips if reduced motion) */}
                  {!prefersReducedMotion && (
                    <>
                      <span
                        aria-hidden
                        className={[
                          "pointer-events-none absolute inset-0 -translate-x-full",
                          "bg-[linear-gradient(120deg,transparent,rgba(255,255,255,0.35),transparent)]",
                          "[mask-image:linear-gradient(to_right,transparent,black_20%,black_80%,transparent)]",
                          "animate-[shine_2.2s_ease-in-out_infinite]"
                        ].join(" ")}
                      />
                      <style jsx>{`@keyframes shine{0%{transform:translateX(-120%)}60%{transform:translateX(120%)}100%{transform:translateX(120%)}}`}</style>
                    </>
                  )}
                  Proceed to checkout
                  <LockClosedIcon className="h-5 w-5 opacity-90" />
                </motion.button>


                {/* Trust row */}
                <div className="mt-3 grid grid-cols-3 gap-2 text-[11px] text-zinc-500 dark:text-zinc-400">
                  <div className="flex items-center gap-1 justify-center">
                    <ShieldCheckIcon className="h-4 w-4" /> Secure
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <TruckIcon className="h-4 w-4" /> Fast shipping
                  </div>
                  <div className="flex items-center gap-1 justify-center">
                    <LockClosedIcon className="h-4 w-4" /> Privacy
                  </div>
                </div>
              </div>
            </div>
          </aside>
        </div>

        {/* Mobile sticky CTA (keeps the money in view) */}
        {/* Step 8 — Mobile sticky CTA (glass + safe area) */}
        <div className="lg:hidden sticky bottom-0 -mx-4 px-4 pt-3 pb-[calc(14px+env(safe-area-inset-bottom))] bg-gradient-to-t from-white/90 dark:from-zinc-900/90 to-transparent backdrop-blur border-t border-zinc-200/70 dark:border-zinc-800/70">
          <div className="flex items-center justify-between">
            <div>
              <div className="text-[11px] text-zinc-500">Subtotal</div>
              <div className="text-xl font-extrabold tabular-nums">{fmt.format(total)}</div>

              {/* tiny status pill (announces politely when it changes) */}
              <div aria-live="polite" className="mt-0.5 text-[11px]">
                {remainingToFree > 0 ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5
                   bg-amber-50 text-amber-700 ring-1 ring-amber-200/60
                   dark:bg-amber-400/10 dark:text-amber-300 dark:ring-amber-400/30"
                  >
                    <span aria-hidden>🚚</span>
                    Add <b className="tabular-nums">{fmt.format(remainingToFree)}</b> for free shipping
                  </span>
                ) : (
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5
                   bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200/60
                   dark:bg-emerald-400/10 dark:text-emerald-300 dark:ring-emerald-400/30"
                  >
                    <span aria-hidden>🎉</span>
                    Free shipping unlocked
                  </span>
                )}
              </div>
            </div>


            <motion.button
              whileTap={{ scale: 0.98 }}
              className="relative inline-flex items-center gap-2 rounded-2xl px-4 py-2.5 font-semibold text-white
                 bg-gradient-to-r from-emerald-600 via-green-600 to-emerald-700
                 shadow-[0_8px_30px_rgba(16,185,129,0.25)] ring-1 ring-white/10"
              aria-label="Proceed to checkout"
            >
              <span className="pointer-events-none absolute inset-0 rounded-2xl bg-white/0"></span>
              Proceed
              <LockClosedIcon className="h-5 w-5 opacity-90" />
            </motion.button>
          </div>
        </div>

      </main>
    </>
  );
}

