"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { createProduct, updateProductById } from "@/lib/adminApi/productActions";
import { updateProductInStore } from "@/redux/slices/productsSlice";
import fetchJSON from "@/lib/fetchJSON";

import BasicsFields from "./parts/BasicsFields";
import PriceStockFields from "./parts/PriceStockFields";
import CategoryDescription from "./parts/CategoryDescription";
import MediaSection from "./parts/MediaSection";

export default function ProductForm({ productId }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [media, setMedia] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [loadingMedia, setLoadingMedia] = useState(!!productId);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const handleMediaChange = useCallback((uploaded) => {
    console.log("[Form] handleMediaChange received:", uploaded);
    setMedia((prev) => [ ...(prev || []), ...(uploaded || []) ]);
  }, []);

  // Load product for edit
  useEffect(() => {
    let cancelled = false;
    if (!productId) { setLoadingProduct(false); return; }

    (async () => {
      try {
        setLoadingProduct(true);
        console.log("[Form] fetching product:", productId);
        const data = await fetchJSON(`/api/admin/manage_products/${productId}`);
        if (cancelled) return;

        if (data?.product) {
          console.log("[Form] fetched product:", data.product);
          setProduct((prev) => {
            if (!prev || prev.id !== data.product.id) {
              reset({ ...data.product });
              return data.product;
            }
            return prev;
          });
        } else {
          alert("Product not found.");
          router.replace("/admin/admin_inventory");
        }
      } catch (err) {
        alert(`Failed to load product: ${err.message}`);
        router.replace("/admin/admin_inventory");
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productId, reset, router]);

  // Load media for edit
  useEffect(() => {
    let cancelled = false;
    if (!productId) { setLoadingMedia(false); return; }

    (async () => {
      try {
        setLoadingMedia(true);
        const d = await fetchJSON(`/api/products/${productId}/media`);
        if (cancelled) return;
        const items = Array.isArray(d?.items) ? d.items : (Array.isArray(d?.media) ? d.media : []);
        setMedia(items);
      } catch {
        if (!cancelled) setMedia([]);
      } finally {
        if (!cancelled) setLoadingMedia(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productId]);

  const derivedImageUrl = useMemo(() => {
    if (!Array.isArray(media) || media.length === 0) return "";
    const isImg = (m) => (m.resourceType || m.resource_type || m.kind || "").toLowerCase() === "image";
    const getUrl = (m) => m.url || m.secure_url || "";
    const primary = media.find((m) => m.is_primary && isImg(m));
    if (primary) return getUrl(primary);
    const first = media.find(isImg);
    return first ? getUrl(first) : "";
  }, [media]);

  async function onSubmit(formData) {
    try {
      const payload = { ...formData };
      if (derivedImageUrl) payload.image_url = derivedImageUrl;
      console.log("[Form] payload being sent:", payload);

      if (productId) {
        console.log("[Form] updating product:", productId, payload);
        const updated = await updateProductById(productId, payload);
        const merged = { id: Number(productId), ...payload, ...(updated?.product || {}) };
        dispatch(updateProductInStore(merged));
        alert("Product updated");
        router.push("/admin/admin_inventory");
        return;
      }

      // CREATE NEW
      console.log("[Form] creating product with payload:", payload);
      const newProduct = await createProduct(payload); // returns { id, ... }
      console.log("[Form] createProduct returned:", newProduct);

      if (newProduct?.id) {
        setProduct(newProduct); // ⬅️ this gives you product?.id
        alert(`Product created (id=${newProduct.id}). You can upload media now.`);
        // Option A: stay here so MediaSection sees product?.id and uploads work
        // Option B: navigate to edit page:
        // router.push(`/admin/admin_inventory/${newProduct.id}`);
      } else {
        console.warn("[Form] No id in createProduct return:", newProduct);
        alert("Product created but no id returned. Check API response/logs.");
      }
    } catch (err) {
      console.error("onSubmit error:", err);
      alert(`Failed to save product: ${err.message}`);
    }
  }

  console.log("[Form] render: prop productId=", productId, "state product?.id=", product?.id);

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <BasicsFields register={register} errors={errors} />
      <PriceStockFields register={register} errors={errors} />
      <CategoryDescription register={register} />

      <div className="text-xs text-gray-500">
        Debug → productId prop: <b>{String(productId)}</b> | product?.id: <b>{String(product?.id)}</b>
      </div>

      <MediaSection
        productId={productId || product?.id}   // ⬅️ critical: pass state id after create
        media={media}
        onMediaChange={handleMediaChange}
        loading={loadingMedia}
      />

      <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-md disabled:bg-gray-400">
        {productId ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}


