// components/CheckoutForm.js
import { useState, useEffect } from "react";
import CustomerInfoForm from "@/components/CustomerInfoForm";
import { validateInfoForm } from "@/utils/validateInfoForm";
import { calcTotals } from "@/lib/utils/calcTotals";

export default function CheckoutForm({
  cartItems,
  sessionId,
  deliveryMethod,
  setDeliveryMethod,
  onValidated,
}) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [formErrors, setFormErrors] = useState({});
  const isFormValid =
    email &&
    deliveryMethod &&
    Object.keys(validateInfoForm({ email, phone, deliveryMethod })).length === 0;

  // 🟦 Load saved contact info on mount
  useEffect(() => {
    const savedEmail = localStorage.getItem("checkout_email");
    const savedPhone = localStorage.getItem("checkout_phone");

    if (savedEmail) setEmail(savedEmail);
    if (savedPhone) setPhone(savedPhone);
  }, []);


  // 🔵 ALWAYS use parent deliveryMethod
  const totals = calcTotals(cartItems, deliveryMethod);

  function updateParent(
    newDeliveryMethod = deliveryMethod,
    liveEmailArg,
    livePhoneArg
  ) {
    const liveEmail = liveEmailArg ?? email;
    const livePhone = livePhoneArg ?? phone;

    const errors = validateInfoForm({
      email: liveEmail,
      phone: livePhone,
      deliveryMethod: newDeliveryMethod,
    });

    setFormErrors(errors);

    // Save to localStorage
    if (liveEmail) localStorage.setItem("checkout_email", liveEmail);
    if (livePhone) localStorage.setItem("checkout_phone", livePhone);

    const snapshot = cartItems.map((i) => ({
      id: i.id,
      name: i.name,
      price: i.price,
      quantity: i.quantity,
    }));

    const freshIsValid =
      liveEmail &&
      newDeliveryMethod &&
      Object.keys(
        validateInfoForm({
          email: liveEmail,
          phone: livePhone,
          deliveryMethod: newDeliveryMethod,
        })
      ).length === 0;

    onValidated({
      email: liveEmail,
      phone: livePhone,
      deliveryMethod: newDeliveryMethod,
      sessionId,
      lockedCartItems: snapshot,
      totals: calcTotals(cartItems, newDeliveryMethod),
      isFormValid: freshIsValid,
    });
  }
  // 🟢 Re-validate automatically when saved data loads
  useEffect(() => {
    if (!email || !deliveryMethod) return;

    updateParent(deliveryMethod, email, phone);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [email, phone, deliveryMethod]);


  return (
    <div className="relative">
      {/* CUSTOMER FORM */}
      <CustomerInfoForm
        email={email}
        setEmail={setEmail}
        phone={phone}
        setPhone={setPhone}
        deliveryMethod={deliveryMethod}
        setDeliveryMethod={setDeliveryMethod}
        formErrors={formErrors}
        updateParent={updateParent}
      />

      {/* FIXED GLOBAL ERROR BANNER */}
      {Object.keys(formErrors).length > 0 && (
        <div className="absolute left-0 right-0 -bottom-12 shake">
          <p className="text-red-500 text-sm font-medium text-center">
            Please enter a valid email and choose a delivery method.
          </p>
        </div>
      )}
      {Object.keys(formErrors).length === 0 && email && (
        <div className="absolute left-0 right-0 -bottom-12 shake">
          <p className="text-green-600 text-sm font-medium text-center">
            ✓ Information looks good.
          </p>
        </div>
      )}

    </div>
  );
}

