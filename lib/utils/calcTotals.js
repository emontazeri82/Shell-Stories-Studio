// utils/calcTotals.js

import { deliveryMethods } from "./deliveryMethods";

export function calcTotals(items = [], deliveryMethod = "standard") {
  // 1. Subtotal
  const subtotal = items.reduce(
    (sum, item) => sum + Number(item.price) * Number(item.quantity),
    0
  );

  // 2. Tax
  const taxRate = 0.085;
  const tax = subtotal * taxRate;

  // 3. Free Delivery Threshold ($30)
  const FREE_THRESHOLD = 30;

  // 4. Lookup method safely
  const method = deliveryMethods[deliveryMethod] || deliveryMethods.standard;

  let deliveryFee = method.fee;

  // Free delivery if threshold reached
  if (subtotal >= FREE_THRESHOLD) {
    deliveryFee = 0;
  }

  // 5. Total
  const total = subtotal + tax + deliveryFee;

  return {
    subtotal,
    tax,
    deliveryFee,
    total,
    deliveryMethodLabel: method.label,
    deliveryEstimate: method.estimate,
    freeDeliveryApplied: subtotal >= FREE_THRESHOLD
  };
}
