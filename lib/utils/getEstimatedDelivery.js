export function getEstimatedDelivery(method) {
    const today = new Date();
  
    function format(date) {
      return date.toLocaleDateString("en-US", {
        month: "short",
        day: "numeric",
      });
    }
  
    // 🚫 Pickup does NOT need estimates → return null
    if (method === "pickup") {
      return null;
    }
  
    // 🚚 Local Delivery → same-day → show ONLY one date
    if (method === "local") {
      return {
        range: format(today),
        rawStart: today,
        rawEnd: today,
      };
    }
  
    // ⚡ Express Delivery → 1–2 days
    if (method === "express") {
      const start = new Date(today);
      start.setDate(start.getDate() + 1);
  
      const end = new Date(today);
      end.setDate(end.getDate() + 2);
  
      return {
        range: `${format(start)} – ${format(end)}`,
        rawStart: start,
        rawEnd: end,
      };
    }
  
    // 📦 Standard Delivery → 3–6 days
    const start = new Date(today);
    start.setDate(start.getDate() + 3);
  
    const end = new Date(today);
    end.setDate(end.getDate() + 6);
  
    return {
      range: `${format(start)} – ${format(end)}`,
      rawStart: start,
      rawEnd: end,
    };
  }
  
  
  