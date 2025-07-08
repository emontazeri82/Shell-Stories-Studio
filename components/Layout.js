"use client";

import Head from "next/head";
import Navbar from "@/components/Navbar";
import AnimatedWaveHeader from "@/components/AnimatedWaveHeader";
import CartPanel from "./CartPanel";
import { useSelector, useDispatch } from "react-redux";
import { closeCart } from "@/redux/slices/cartSlice";

export default function Layout({ title = "Shell Stories Studio", children }) {
  const isCartOpen = useSelector((state) => state.cart.isCartOpen);
  const dispatch = useDispatch();

  return (
    <>
      <Head>
        <title>{title}</title>
        <meta name="description" content="Handmade shell decorations" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="icon" href="/favicon.ico" />
      </Head>

      <div className="relative flex flex-col min-h-screen font-sans bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Navbar onCartClick={() => setIsCartOpen(true)} />
        <CartPanel isOpen={isCartOpen} onClose={() => dispatch(closeCart())} />   {/* fixed at the top */}
        <AnimatedWaveHeader /> {/* under navbar */}

        <main className="flex-grow">{children}</main>

        <footer className="bg-gray-100 dark:bg-gray-800 text-center text-sm text-gray-500 dark:text-gray-400 py-4">
          &copy; {new Date().getFullYear()} Shell Stories Studio. All rights reserved.
        </footer>
      </div>
    </>
  );
}


