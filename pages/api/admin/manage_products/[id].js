// /pages/api/admin/manage_products/[id].js
import { createAdminHandler } from "@/lib/middleware/createAdminHandler";
import {
  getProductById,
  updateProductById,
} from "@/lib/productHelpers";
import {
  deleteProductById,
  updateProductStatus,
} from "@/lib/productApiUtils";
import {
  sendSuccessResponse,
  sendErrorResponse,
  validateProductData,
} from "@/lib/api";
import { getRedisClient } from "@/lib/redis";
import { safeRedisKey } from "@/lib/redis/formatkey";
import { sanitizeProductFields } from "@/lib/utils/sanitizeProductFields";
import { getProductWithMediaById } from "@/lib/db"; // ✅ added
// --------------------------------------------------
// 🔧 Small type helpers
// --------------------------------------------------
const isPosInt = (v) => Number.isInteger(v) && v > 0;
const asInt = (v) => {
  const n = Number(v);
  return Number.isInteger(n) ? n : NaN;
};
const asNumber = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : NaN;
};
const asTinyint = (v) => (Number(v) === 1 || v === true ? 1 : 0);

// --------------------------------------------------
// 🔄 Utility: Invalidate Redis product cache
// --------------------------------------------------
async function invalidateProductsCache() {
  try {
    const redis = await getRedisClient();
    const pattern = `${safeRedisKey(["products"])}:*`;
    const keys = await redis.keys(pattern);
    if (keys.length) await redis.del(...keys);
  } catch (e) {
    console.warn("⚠️ Redis invalidate skipped:", e?.message || e);
  }
}

// --------------------------------------------------
// ⚙️ Handler setup
// --------------------------------------------------
const handler = createAdminHandler({
  rateLimit: { limit: 60, window: 60 },
});

/* ───────────────────────────────────────────────
   ✅ GET /api/admin/manage_products/:id
   Includes full media array using getProductWithMediaById()
──────────────────────────────────────────────── */
handler.get(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, "Invalid id");

  try {
    console.log(`[GET] 🧠 Fetching product ${idNum} with media...`);
    const product = await getProductWithMediaById(idNum);

    if (!product) return sendErrorResponse(res, 404, "Product not found");

    return sendSuccessResponse(res, 200, "Product fetched successfully", {
      product,
    });
  } catch (err) {
    console.error("❌ Failed to fetch product by ID:", err);
    return sendErrorResponse(res, 500, "Failed to fetch product");
  }
});

/* ───────────────────────────────────────────────
   ✅ PUT /api/admin/manage_products/:id
   Partial update (only provided fields)
──────────────────────────────────────────────── */
handler.put(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, "Invalid id");

  try {
    const current = await getProductById(idNum);
    if (!current) return sendErrorResponse(res, 404, "Product not found");

    const input = req.body ?? {};
    const patch = {};

    if ("name" in input) patch.name = String(input.name);
    if ("description" in input) patch.description = String(input.description);
    if ("price" in input) patch.price = asNumber(input.price);
    if ("stock" in input) patch.stock = asInt(input.stock);
    if ("image_url" in input) patch.image_url = String(input.image_url || "");
    if ("image_public_id" in input)
      patch.image_public_id = String(input.image_public_id || "");
    if ("category" in input) patch.category = String(input.category || "decor");
    if ("is_active" in input) patch.is_active = asTinyint(input.is_active);
    if ("is_favorite" in input) patch.is_favorite = asTinyint(input.is_favorite);

    const sanitized = sanitizeProductFields
      ? sanitizeProductFields(patch)
      : patch;

    if (!Object.keys(sanitized).length)
      return sendErrorResponse(res, 400, "Nothing to update");

    const validationError = validateProductData(sanitized);
    if (validationError) return sendErrorResponse(res, 400, validationError);

    const result = await updateProductById(idNum, sanitized);
    if (!result || result.changes === 0)
      return sendErrorResponse(res, 404, "Product not found");

    await invalidateProductsCache();

    return sendSuccessResponse(res, 200, "Product updated successfully", {
      product: { id: idNum, ...sanitized },
    });
  } catch (err) {
    console.error("❌ Failed to update:", err);
    return sendErrorResponse(res, 500, "Failed to update product");
  }
});

/* ───────────────────────────────────────────────
   ✅ DELETE /api/admin/manage_products/:id
──────────────────────────────────────────────── */
handler.delete(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, "Invalid id");

  try {
    const result = await deleteProductById(idNum);
    if (!result || result.changes === 0)
      return sendErrorResponse(res, 404, "Product not found");

    await invalidateProductsCache();

    return sendSuccessResponse(res, 200, "Product deleted successfully");
  } catch (err) {
    console.error("❌ Failed to delete product:", err);
    return sendErrorResponse(res, 500, "Failed to delete product");
  }
});

/* ───────────────────────────────────────────────
   ✅ PATCH /api/admin/manage_products/:id
   Quick toggle for is_active
──────────────────────────────────────────────── */
handler.patch(async (req, res) => {
  res.setHeader("Content-Type", "application/json; charset=utf-8");
  const idNum = asInt(req.query.id);
  if (!isPosInt(idNum)) return sendErrorResponse(res, 400, "Invalid id");

  const { is_active, isActive } = req.body ?? {};
  const toggle = Number(is_active ?? isActive);

  if (!Number.isFinite(toggle)) {
    console.warn("⚠️ Invalid PATCH body:", req.body);
    return sendErrorResponse(res, 400, "Missing or invalid is_active");
  }

  try {
    await updateProductStatus(idNum, asTinyint(toggle));
    await invalidateProductsCache();

    return sendSuccessResponse(res, 200, "Status updated", { success: true });
  } catch (err) {
    console.error("❌ Failed to update status:", err);
    return sendErrorResponse(res, 500, "Internal Server Error");
  }
});

export default handler;







