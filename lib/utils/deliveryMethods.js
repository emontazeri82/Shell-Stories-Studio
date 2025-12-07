export const deliveryMethods = {
    standard: {
      fee: 5.99,
      label: "Standard Delivery",
      estimate: "3–7 days",
    },
  
    express: {
      fee: 12.99,
      label: "Express Delivery",
      estimate: "1–3 days",
    },
  
    pickup: {
      fee: 0,
      label: "Store Pickup",
      estimate: "Ready today",
    },
  
    local: {
      fee: 4.99,                    // ← adjust if needed
      label: "Local Delivery",
      estimate: "Same day (Austin only)",
      restrictedArea: "Austin, TX", // optional extra metadata
    }
  };
  