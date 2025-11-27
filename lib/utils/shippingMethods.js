// utils/shippingMethods.js

export const shippingMethods = {
    standard: {
      label: "Standard Shipping",
      baseFee: 5.99,
      deliveryEstimate: "3–6 business days",
    },
  
    express: {
      label: "Express Shipping",
      baseFee: 12.99,
      deliveryEstimate: "1–2 business days",
    },
  
    local_delivery: {
      label: "Local Delivery",
      baseFee: 7.99,
      deliveryEstimate: "Same day / Next day",
    },
  
    pickup: {
      label: "Store Pickup",
      baseFee: 0,
      deliveryEstimate: "Ready in 2 hours",
    },
  
    // ⭐️ You can add future shipping types here:
    // dhl_express: {
    //   label: "DHL Express",
    //   baseFee: 24.99,
    //   deliveryEstimate: "2–3 business days",
    // },
  };
  