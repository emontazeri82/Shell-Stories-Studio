"use client";

import Head from "next/head";
import Navbar from "@/components/Navbar";
import AnimatedWaveHeader from "@/components/AnimatedWaveHeader";
import CartPanel from "../CartPanel";
import { useSelector, useDispatch } from "react-redux";
import { openCart, closeCart } from "@/redux/slices/cartSlice";
import Footer from "./Footer";

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

      <div className="relative flex flex-col min-h-screen font-poppins bg-white text-gray-900 dark:bg-gray-900 dark:text-gray-100">
        <Navbar onCartClick={() => dispatch(openCart())} />
        <CartPanel isOpen={isCartOpen} onClose={() => dispatch(closeCart())} />   {/* fixed at the top */}
        <AnimatedWaveHeader /> {/* under navbar */}

        <main className="relative flex-grow bg-gradient-to-b from-white via-amber-50/20 to-white">
          {/* NOISE TEXTURE */}
          <div
            className="absolute inset-0 opacity-[0.03] pointer-events-none bg-[url('/textures/noise.png')]"
          ></div>

          {/* VIGNETTE SHADOW */}
          <div className="absolute inset-0 pointer-events-none shadow-[inset_0_0_120px_rgba(0,0,0,0.04)]"></div>

          {/* PAGE CONTENT */}
          <div className="relative z-10">
            {children}
          </div>
        </main>
        <Footer />
      </div>
    </>
  );
}


