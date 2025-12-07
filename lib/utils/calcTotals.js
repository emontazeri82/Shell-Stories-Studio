import { deliveryMethods } from "./deliveryMethods";
import { FREE_SHIP_THRESHOLD } from "@/lib/constant";

export function calcTotals(items = [], deliveryMethod = "standard") {
  // 1. Subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  // 2. Tax
  const taxRate = 0.085;
  const tax = subtotal * taxRate;

  // 3. Delivery method data
  const method = deliveryMethods[deliveryMethod] || deliveryMethods.standard;

  // 4. Delivery Fee Logic
  let deliveryFee = method.fee;

  // 🔥 FREE SHIPPING for STANDARD delivery only if subtotal >= $120
  if (deliveryMethod === "standard" && subtotal >= FREE_SHIP_THRESHOLD) {
    deliveryFee = 0;
  }

  // 5. Final Total
  const total = subtotal + tax + deliveryFee;

  return {
    subtotal,
    tax,
    deliveryFee,
    total,
    deliveryMethodLabel: method.label,
    deliveryEstimate: method.estimate,
    freeDeliveryApplied:
      deliveryMethod === "standard" && subtotal >= FREE_SHIP_THRESHOLD,
  };
}


