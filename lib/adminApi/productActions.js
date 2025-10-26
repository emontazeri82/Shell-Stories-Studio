// lib/adminApi/productActions.js
import { logFetch } from "@/lib/debug/logFetch";

class ResponseError extends Error {
  constructor(message, response, body) {
    super(message);
    this.name = "ResponseError";
    this.response = response;
    this.body = body;
  }
}

async function fetchJson(url, options = {}) {
  const res = await logFetch(url, options);
  let body;
  try {
    body = await res.json();
  } catch (e) {
    // Could not parse JSON
    throw new ResponseError(
      `Invalid JSON response (HTTP ${res.status})`,
      res,
      null
    );
  }

  if (!res.ok) {
    // Non-2xx status
    const errMsg = body?.error || body?.message || `Unexpected HTTP ${res.status}`;
    throw new ResponseError(errMsg, res, body);
  }

  return body;
}

export async function createProduct(productData) {
  console.log("[FE] createProduct → sending:", productData);
  const body = await fetchJson("/api/admin/manage_products", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });

  const product = body.product || body;
  if (!product?.id) {
    console.warn("[FE] createProduct → missing product.id in response:", body);
  }

  console.log("[FE] createProduct ← complete:", product);
  return product;
}

export async function updateProductById(productId, productData) {
  console.log("[FE] updateProductById →", productId, productData);
  const body = await fetchJson(`/api/admin/manage_products/${productId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(productData),
  });

  const product = body.product || body;
  if (!product?.id) {
    console.warn("[FE] updateProductById → missing product.id in response:", body);
  }

  console.log("[FE] updateProductById ← complete:", product);
  return product;
}


