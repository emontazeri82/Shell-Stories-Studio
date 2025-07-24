// components/CustomerInfoForm.js
"use client";
import FormErrors from "./FormErrors";

export default function CustomerInfoForm({ email, setEmail, phone, setPhone, deliveryMethod, setDeliveryMethod, onSubmit, formErrors }) {

    return (
        <form
            onSubmit={onSubmit}
            className="bg-white dark:bg-gray-800 p-4 rounded shadow mb-6 space-y-4 font-poppins"
        >
            <div>
                <label className="block text-sm font-semibold mb-1">Email Address</label>
                <input
                    type="email"
                    required
                    className="w-full p-2 border rounded"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="your@email.com"
                />
                <FormErrors error={formErrors?.email} />
            </div>

            <div>
                <label className="block text-sm font-semibold mb-1">Phone Number</label>
                <input
                    type="tel"
                    className="w-full p-2 border rounded"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="Optional but helpful"
                />
                <FormErrors error={formErrors?.phone} />
            </div>

            <div>
                <label className="block text-sm font-semibold mb-1">Delivery Method</label>
                <select
                    value={deliveryMethod}
                    onChange={(e) => setDeliveryMethod(e.target.value)}
                    className="w-full p-2 border rounded"
                >
                    <option value="standard">Standard (5–7 days) – Free</option>
                    <option value="express">Express (2–3 days) – $9.99</option>
                    <option value="pickup">Local Pickup</option>
                </select>
                <FormErrors error={formErrors?.deliveryMethod} />
            </div>
            <button
                type="submit"
                className="w-full bg-indigo-600 text-white py-2 rounded hover:bg-indigo-700 transition font-semibold tracking-wide font-poppins"
            >
                Continue to Payment
            </button>
        </form>
    );
}
