"use client";
import FormErrors from "./FormErrors";

export default function CustomerInfoForm({
  email, setEmail,
  phone, setPhone,
  deliveryMethod, setDeliveryMethod,
  formErrors,
  updateParent   // ✅ required to push updates to CheckoutPage
}) {
  return (
    <div className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 space-y-4 font-poppins">

      {/* EMAIL */}
      <div>
        <label className="block text-sm font-semibold mb-1">Email Address</label>
        <input
          type="email"
          className="w-full p-2 border rounded"
          value={email}
          onChange={(e) => {
            const value = e.target.value;
            setEmail(value);
            updateParent(deliveryMethod, value, phone);
          }}
          placeholder="your@email.com"
        />
        <FormErrors error={formErrors?.email} />
      </div>

      {/* PHONE */}
      <div>
        <label className="block text-sm font-semibold mb-1">Phone Number</label>
        <input
          type="tel"
          className="w-full p-2 border rounded"
          value={phone}
          onChange={(e) => {
            const value = e.target.value;
            setPhone(value);
            updateParent(deliveryMethod, email, value);
          }}          
          placeholder="Optional but helpful"
        />
        <FormErrors error={formErrors?.phone} />
      </div>

      {/* DELIVERY METHOD */}
      <div>
        <label className="block text-sm font-semibold mb-1">Delivery Method</label>

        <div className="max-w-xs w-full md:w-72">
          <select
            value={deliveryMethod}
            onChange={(e) => {
              const method = e.target.value;
              setDeliveryMethod(method);
              updateParent(method, email, phone);
            }}            
            className="rounded-lg border px-3 py-2 max-w-[300px] w-full truncate"
          >

            <option value="standard">
              🚚 Standard Delivery — 3–6 days
            </option>

            <option value="express">
              ⚡ Express Delivery — 1–2 days
            </option>

            <option value="local">
              🏠 Local Delivery — same day
            </option>

            <option value="pickup">
              🏬 Store Pickup — free
            </option>
          </select>

          <FormErrors error={formErrors?.deliveryMethod} />

        </div>
      </div>
    </div>
  );
}

