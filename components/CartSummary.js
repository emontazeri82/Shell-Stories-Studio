// components/CartSummary.js
"use client";

import { useSelector, useDispatch } from "react-redux";
import { clearCart } from "@/redux/slices/cartSlice";
import { useRouter } from "next/navigation";
import { toast } from "react-hot-toast";
import PriceBreakdown from "./PriceBreakdown";

export default function CartSummary() {
  const dispatch = useDispatch();
  const router = useRouter();
  const items = useSelector((state) => state.cart.items);

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error("Your cart is empty.");
      return;
    }
    toast.success("✅ Proceeding to checkout...");
    console.log("Proceed button clicked");
    router.push("/checkout");
  };

  const handleClear = () => {
    dispatch(clearCart());
    localStorage.removeItem("cartItems");
    toast("🧹 Cart cleared");
  };

  return (
    <PriceBreakdown
      items={items}
      showButtons={true}
      onCheckout={handleCheckout}
      onClear={handleClear}
    />
  );
}

