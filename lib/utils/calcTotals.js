import { deliveryMethods } from "./deliveryMethods";
import { FREE_SHIP_THRESHOLD } from "@/lib/constant";

export function calcTotals(items = [], deliveryMethod = "standard") {
  // 1️⃣ Subtotal + Discount
  let originalSubtotal = 0;
  let subtotal = 0;
  let discount = 0;

  items.forEach((item, index) => {
    const basePrice = Number(item.price || 0);
    const qty = Number(item.quantity || 0);
    console.log(`🧾 Item ${index}`, {
      id: item.id,
      price: item.price,
      quantity: item.quantity,
      discount_active: item.discount_active,
      discount_percent: item.discount_percent,
    });
    originalSubtotal += basePrice * qty;
    // ✅ ADD THESE TWO LINES HERE
    const percent = Number(item.discount_percent || 0);
    const hasDiscount = Number(item.discount_active) === 1 && percent > 0;
  
    const discountedPrice = hasDiscount
      ? basePrice - (basePrice * percent) / 100
      : basePrice;
  
    subtotal += discountedPrice * qty;
  
    if (hasDiscount) {
      discount += (basePrice - discountedPrice) * qty;
    }
  });  

  // 2️⃣ Tax (on discounted subtotal)
  const taxRate = 0.085;
  const tax = subtotal * taxRate;

  // 3️⃣ Delivery method data
  const method = deliveryMethods[deliveryMethod] || deliveryMethods.standard;

  // 4️⃣ Delivery Fee Logic
  let deliveryFee = method.fee;

  // FREE SHIPPING (STANDARD ONLY)
  if (deliveryMethod === "standard" && subtotal >= FREE_SHIP_THRESHOLD) {
    deliveryFee = 0;
  }

  // 5️⃣ Final Total
  const total = subtotal + tax + deliveryFee;

  return {
    originalSubtotal,
    subtotal,
    discount,          // ✅ NEW
    tax,
    deliveryFee,
    total,
    deliveryMethodLabel: method.label,
    deliveryEstimate: method.estimate,
    freeDeliveryApplied:
      deliveryMethod === "standard" && subtotal >= FREE_SHIP_THRESHOLD,
  };
}



