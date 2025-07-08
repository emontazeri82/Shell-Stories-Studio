import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { setCartItems } from "@/redux/slices/cartSlice";

export function usePersistentCart() {
  const dispatch = useDispatch();
  const items = useSelector((state) => state.cart.items);

  // Load from localStorage once
  useEffect(() => {
    const saved = localStorage.getItem("cartItems");
    if (saved) {
      try {
        dispatch(setCartItems(JSON.parse(saved)));
      } catch {}
    }
  }, [dispatch]);

  // Save to localStorage on changes
  useEffect(() => {
    localStorage.setItem("cartItems", JSON.stringify(items));
  }, [items]);
}
