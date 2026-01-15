// /lib/sanitize/sanitizeProductPatch.js
export function sanitizeProductPatch(patch = {}) {
    const sanitized = {};
  
    if ("name" in patch)
      sanitized.name = String(patch.name || "").trim();
  
    if ("description" in patch)
      sanitized.description = patch.description;
  
    if ("price" in patch)
      sanitized.price = Number(patch.price);
  
    if ("stock" in patch)
      sanitized.stock = Number(patch.stock);
  
    if ("category" in patch)
      sanitized.category = String(patch.category || "").trim();
  
    if ("is_active" in patch)
      sanitized.is_active = patch.is_active ? 1 : 0;
  
    if ("is_favorite" in patch)
      sanitized.is_favorite = patch.is_favorite ? 1 : 0;
  
    // ✅ discount
    if ("discount_active" in patch)
      sanitized.discount_active = patch.discount_active ? 1 : 0;
  
    if ("discount_percent" in patch)
      sanitized.discount_percent = Math.max(
        0,
        Math.min(100, Number(patch.discount_percent))
      );
  
    return sanitized;
  }
  