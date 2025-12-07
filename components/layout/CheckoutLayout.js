"use client";

import Head from "next/head";
import Navbar from "@/components/Navbar";
import { useSelector, useDispatch } from "react-redux";
import { openCart, closeCart } from "@/redux/slices/cartSlice";
import Footer from "./Footer";
import CartPanel from "../CartPanel";

export default function CheckoutLayout({
  title = "Checkout — Shell Stories Studio",
  children
}) {
  const isCartOpen = useSelector((s) => s.cart.isCartOpen);
  const dispatch = useDispatch();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Secure checkout — Shell Stories" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      {/* Wrapper */}
      <div className="min-h-screen flex flex-col font-poppins bg-white dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100">

        {/* Navbar only — no wave, no hero */}
        <Navbar onCartClick={() => dispatch(openCart())} />

        {/* Slide-out Cart Panel */}
        <CartPanel
          isOpen={isCartOpen}
          onClose={() => dispatch(closeCart())}
        />

        {/* MAIN CONTENT */}
        <main className="flex-grow relative px-4 py-10 max-w-5xl mx-auto">

          {/* Light noise texture */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/textures/noise.png')]"
          />

          {/* subtle inset vignette */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.05)]" />

          <div className="relative z-10">
            {children}
          </div>

        </main>

        {/* Minimal Footer */}
        <Footer />

      </div>
    </>
  );
}

