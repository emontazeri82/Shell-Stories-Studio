"use client";

import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";
import { useRouter } from "next/router";
import { toast } from "react-hot-toast";
import { showLoading, hideLoading } from "@/utils/toastloading";
import axios from "axios";
import { clearCart } from '@/redux/slices/cartSlice';
import { useDispatch } from "react-redux";

const CheckoutWithPayPal = ({ totalAmount, cartItems, sessionId, email, phone, deliveryMethod }) => {
  const router = useRouter();
  const dispatch = useDispatch();

  // ✅ Prevent rendering if cart is empty
  if (!cartItems || cartItems.length === 0) {
    return (
      <p className="text-red-500 text-center font-semibold text-base font-sans">
        🛒 Your cart is empty. Please add items before checking out.
      </p>
    );
  }

  // ✅ Create PayPal Order
  const handleCreateOrder = async () => {
    showLoading("Creating PayPal order...");
    try {
      const res = await axios.post("/api/paypal/create-order", {
        total: totalAmount,
        items: cartItems,
        sessionId: sessionId,
        deliveryMethod,
      });

      const orderId = res?.data?.id;
      if (!orderId) {
        toast.error("❌ Failed to retrieve PayPal order ID.");
        console.error("Missing order ID:", res?.data);
        return null;
      }

      return orderId;
    } catch (err) {
      console.error("Create Order Error:", err);
      toast.error("❌ Failed to create PayPal order.");
      return null;
    } finally {
      hideLoading();
    }
  };

  // ✅ Capture PayPal Order
  const handleCaptureOrder = async (data) => {
    showLoading("Capturing payment...");
    try {
      const res = await axios.post("/api/paypal/capture-order", {
        orderID: data.orderID,
        cartItems: cartItems,
        sessionId,
        total: totalAmount,
        email,
        phone,
        deliveryMethod
      });

      if (res?.data?.success) {
        toast.success("✅ Payment successful!");
        //clear the cart in Redux
        dispatch(clearCart());
        localStorage.removeItem("cartItems");
        
        router.push("/thank-you");
      } else {
        toast.error("❌ Payment failed.");
        console.error("Payment failed response:", res?.data);
      }
    } catch (err) {
      console.error("Capture Error:", err);
      toast.error("❌ Could not complete payment.");
    } finally {
      hideLoading();
    }
  };

  // ✅ Render PayPal UI
  return (
    <PayPalScriptProvider
      options={{
        "client-id": process.env.NEXT_PUBLIC_PAYPAL_CLIENT_ID,
        components: "buttons",
        currency: "USD",
        intent: "capture",
        "disable-funding": "", // allow card + PayPal
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
          console.error("PayPal Error:", err);
          toast.error("❌ Something went wrong with PayPal.");
        }}
        onCancel={() => {
          hideLoading();
          toast("⚠️ Payment was cancelled.");
        }}
      />
    </PayPalScriptProvider>
  );
};

export default CheckoutWithPayPal;


