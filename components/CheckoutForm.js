// components/CheckoutForm.js
import { useState } from "react";
import CustomerInfoForm from "@/components/CustomerInfoForm";
import CheckoutWithPayPal from "@/components/CheckoutWithPayPal";
import { validateInfoForm } from "@/utils/validateInfoForm";
import { calcTotals } from "@/lib/utils/calcTotals";



export default function CheckoutForm({ cartItems, sessionId }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [deliveryMethod, setDeliveryMethod] = useState("standard");
  const [formErrors, setFormErrors] = useState({});
  const [showPayPal, setShowPayPal] = useState(false);
  
  const totals = calcTotals(cartItems, deliveryMethod);
  
  // 👉 totalAmount must always be totals.total
  const totalAmount = totals.total;


  const handleSubmit = (e) => {
    e.preventDefault();

    const errors = validateInfoForm({ email, phone, deliveryMethod });
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      console.log("❌ Validation errors:", errors);
      alert("Please fix the form before proceeding.");
      return;
    }

    setShowPayPal(true);
  };

  return (
    <>
      {!showPayPal ? (
        <CustomerInfoForm
          email={email}
          setEmail={setEmail}
          phone={phone}
          setPhone={setPhone}
          deliveryMethod={deliveryMethod}
          setDeliveryMethod={setDeliveryMethod}
          onSubmit={handleSubmit}
          formErrors={formErrors}
        />
      ) : (
        <CheckoutWithPayPal
          cartItems={cartItems}
          totalAmount={total}
          totals={totals}
          sessionId={sessionId}
          email={email}
          phone={phone}
          deliveryMethod={deliveryMethod}
        />
      )}
    </>
  );
}
