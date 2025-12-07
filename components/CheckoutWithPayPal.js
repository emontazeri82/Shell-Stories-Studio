"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import axios from "axios";
import { showLoading, hideLoading } from "@/utils/toastloading";
import { clearCart } from "@/redux/slices/cartSlice";
import { useDispatch } from "react-redux";
import { validateInfoForm } from "@/utils/validateInfoForm";

export default function CheckoutWithPayPal({
  totalAmount,
  totals,
  cartItems,
  sessionId,
  email,
  phone,
  deliveryMethod,
  isFormValid
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

  if (!cartItems || cartItems.length === 0) {
    return (
      <p className="text-red-500 text-center font-semibold text-base font-sans">
        🛒 Your cart is empty. Please add items before checking out.
      </p>
    );
  }

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
        total: totalAmount,
        items: cartItems,
        sessionId,
        deliveryMethod,
        totals,
      });

      const orderId = res?.data?.id;
      if (!orderId) {
        toast.error("❌ Missing PayPal order ID");
        return null;
      }

      return orderId;
    } catch (err) {
      console.error("[PayPal] Create Order Error:", err);
      toast.error("❌ Failed to create PayPal order.");
      return null;
    } finally {
      hideLoading();
    }
  };

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

      if (res?.data?.success) {
        toast.success("✅ Payment successful!");
        dispatch(clearCart());
        localStorage.removeItem("cartItems");
        router.push("/thank-you");
      } else {
        toast.error("❌ Payment failed.");
      }
    } catch (err) {
      console.error("[PayPal] Capture Error:", err);
      toast.error("❌ Could not complete payment.");
    } finally {
      hideLoading();
    }
  };

  return (
    <>
      <PayPalScriptProvider
        options={{
          "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
          components: "buttons",
          currency: "USD",
          intent: "capture",
          "disable-funding": "",
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
          disabled={!isFormValid}   // ⛔ PREVENT invalid checkout
          createOrder={async () => {
            if (!isFormValid) {
              toast.error("Please complete your contact information.");
              return null;
            }
            const orderId = await handleCreateOrder();
            return orderId;
          }}

          onApprove={handleCaptureOrder}

          onError={(err) => {
            hideLoading();
            console.error("[PayPal] Error:", err);
            toast.error("❌ Something went wrong with PayPal.");
          }}

          onCancel={() => {
            hideLoading();
            toast("⚠️ Payment was cancelled.");
          }}
        />
      </PayPalScriptProvider>
    </>

  );
}



