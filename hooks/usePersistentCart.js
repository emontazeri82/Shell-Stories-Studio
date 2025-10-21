"use client";

import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import * as CartSlice from "@/redux/slices/cartSlice"; 

export function usePersistentCart() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);

  // ✅ Load from localStorage once (only in browser)
  useEffect(() => {
    if (typeof window === "undefined") return; // SSR safety

    const saved = localStorage.getItem("cartItems");

    if (saved) {
      try {
        const parsed = JSON.parse(saved);

        if (typeof CartSlice.setCartItems !== "function") {
          console.error("❌ setCartItems is not a function at runtime");
        }

        dispatch(CartSlice.setCartItems(parsed)); // ✅ Dispatch safely
      } catch (err) {
        console.error("❌ Failed to parse cartItems:", err);
      }
    }
  }, [dispatch]);

  // ✅ Save to localStorage on changes (browser only)
  useEffect(() => {
    if (typeof window === "undefined") return;
    localStorage.setItem("cartItems", JSON.stringify(items));
  }, [items]);
}


