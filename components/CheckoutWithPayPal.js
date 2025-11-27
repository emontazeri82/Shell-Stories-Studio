"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import axios from "axios";
import { showLoading, hideLoading } from "@/utils/toastloading";
import { clearCart } from "@/redux/slices/cartSlice";
import { useDispatch } from "react-redux";

export default function CheckoutWithPayPal({
  totalAmount,      // MUST be a number (from calcTotals.total)
  totals,           // (optional) subtotal, tax, deliveryFee, etc.
  cartItems,
  sessionId,
  email,
  phone,
  deliveryMethod,
}) {
  const router = useRouter();
  const dispatch = useDispatch();

  console.log("=== PayPal Debug Info ===");
  console.log("Total Amount:", totalAmount);
  console.log("Totals Object:", totals);
  console.log("Cart Items:", cartItems);
  console.log("Session ID:", sessionId);
  console.log("Email:", email);
  console.log("Phone:", phone);
  console.log("Delivery Method:", deliveryMethod);
  console.log("=========================");

  // ❗ Prevent checkout with empty cart
  if (!cartItems || cartItems.length === 0) {
    return (
      <p className="text-red-500 text-center font-semibold text-base font-sans">
        🛒 Your cart is empty. Please add items before checking out.
      </p>
    );
  }

  // ------------------------------------------------
  // 🔵 CREATE PAYPAL ORDER
  // ------------------------------------------------
  const handleCreateOrder = async () => {
    console.log("[PayPal] Creating order...");
    console.log("[PayPal] Sending to backend:", {
      total: totalAmount,
      items: cartItems,
      sessionId,
      deliveryMethod,
      totals,
    });

    showLoading("Creating PayPal order...");

    try {
      const res = await axios.post("/api/paypal/create-order", {
        total: totalAmount,  // <- MUST be a number
        items: cartItems,
        sessionId,
        deliveryMethod,
        totals,               // <- full breakdown for backend validation
      });

      console.log("[PayPal] Backend create-order response:", res.data);

      const orderId = res?.data?.id;
      if (!orderId) {
        toast.error("❌ Missing PayPal order ID");
        console.error("[PayPal] No order ID returned:", res.data);
        return null;
      }

      console.log("[PayPal] Order created:", orderId);
      return orderId;
    } catch (err) {
      console.error("[PayPal] Create Order Error:", err);
      toast.error("❌ Failed to create PayPal order.");
      return null;
    } finally {
      hideLoading();
    }
  };

  // ------------------------------------------------
  // 🟢 CAPTURE PAYPAL ORDER
  // ------------------------------------------------
  const handleCaptureOrder = async (data) => {
    console.log("[PayPal] Approve received:", data);

    showLoading("Capturing payment...");

    try {
      const res = await axios.post("/api/paypal/capture-order", {
        orderID: data.orderID,
        cartItems,
        sessionId,
        total: totalAmount,
        email,
        phone,
        deliveryMethod,
        totals,
      });

      console.log("[PayPal] Capture Order response:", res.data);

      if (res?.data?.success) {
        toast.success("✅ Payment successful!");
        dispatch(clearCart());
        localStorage.removeItem("cartItems");

        router.push("/thank-you");
      } else {
        toast.error("❌ Payment failed.");
        console.error("[PayPal] Payment failed response:", res?.data);
      }
    } catch (err) {
      console.error("[PayPal] Capture Error:", err);
      toast.error("❌ Could not complete payment.");
    } finally {
      hideLoading();
    }
  };

  // ------------------------------------------------
  // 🟡 PAYPAL UI RENDER
  // ------------------------------------------------
  return (
    <PayPalScriptProvider
      options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        components: "buttons",
        currency: "USD",
        intent: "capture",
        "disable-funding": "", // allow cards + PayPal
      }}
    >
      <PayPalButtons
        style={{
          layout: "vertical",
          label: "paypal",
          shape: "rect",
          color: "gold",
          height: 45,
        }}
        createOrder={handleCreateOrder}
        onApprove={handleCaptureOrder}
        onError={(err) => {
          hideLoading();
          console.error("[PayPal] Error:", err);
          toast.error("❌ Something went wrong with PayPal.");
        }}
        onCancel={() => {
          hideLoading();
          console.warn("[PayPal] Payment Cancelled.");
          toast("⚠️ Payment was cancelled.");
        }}
      />
    </PayPalScriptProvider>
  );
}



