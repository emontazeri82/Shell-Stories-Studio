"use client";
import { useEffect, useMemo, useState, useCallback } from "react";
import { useForm } from "react-hook-form";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import axios from "axios";
import { updateProductInStore } from "@/redux/slices/productsSlice";

import BasicsFields from "./parts/BasicsFields";
import PriceStockFields from "./parts/PriceStockFields";
import CategoryDescription from "./parts/CategoryDescription";
import MediaSection from "./parts/MediaSection";

export default function ProductForm({ productId }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [media, setMedia] = useState([]);
  const [pendingMedia, setPendingMedia] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [loadingMedia, setLoadingMedia] = useState(!!productId);

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  const handleMediaChange = useCallback((uploaded) => {
    console.log("[Form] handleMediaChange received:", uploaded);
    setMedia((prev) => [...(prev || []), ...(uploaded || [])]);
    setPendingMedia((prev) => [...(prev || []), ...(uploaded || [])]);
  }, []);

  // ────────────────────────────────
  // Load product for editing
  // ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!productId) { setLoadingProduct(false); return; }

    (async () => {
      try {
        setLoadingProduct(true);
        const url = `/api/admin/manage_products/${productId}`;
        console.log("[Axios] Calling:", url);
        const { data } = await axios.get(url);

        if (cancelled) return;
        if (data?.product) {
          reset({ ...data.product });
          setProduct(data.product);
        } else {
          alert("Product not found.");
          router.replace("/admin/admin_inventory");
        }
      } catch (err) {
        console.error("[Axios] Error at:", `/api/admin/manage_products/${productId}`, err);
        alert(`Failed to load product: ${err.response?.data?.error || err.message}`);
        router.replace("/admin/admin_inventory");
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productId, reset, router]);

  // ────────────────────────────────
  // Load existing media for editing
  // ────────────────────────────────
  useEffect(() => {
    let cancelled = false;
    if (!productId) { setLoadingMedia(false); return; }

    (async () => {
      try {
        setLoadingMedia(true);
        const url = `/api/products/${productId}/media`;
        console.log("[Axios] Calling:", url);
        const { data } = await axios.get(url);

        if (cancelled) return;
        const items = Array.isArray(data?.items)
          ? data.items
          : Array.isArray(data?.media)
            ? data.media
            : [];
        setMedia(items);
      } catch (err) {
        console.error("[Axios] Error at:", `/api/products/${productId}/media`, err);
        if (!cancelled) setMedia([]);
      } finally {
        if (!cancelled) setLoadingMedia(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productId]);

  // ────────────────────────────────
  // Derive preview image
  // ────────────────────────────────
  const derivedImageUrl = useMemo(() => {
    if (!Array.isArray(media) || media.length === 0) return "";
    const isImg = (m) => (m.resourceType || m.resource_type || m.kind || "").toLowerCase() === "image";
    const getUrl = (m) => m.url || m.secure_url || "";
    const primary = media.find((m) => m.is_primary && isImg(m));
    if (primary) return getUrl(primary);
    const first = media.find(isImg);
    return first ? getUrl(first) : "";
  }, [media]);

  // ────────────────────────────────
  // Legacy helper (for existing products only)
  // ────────────────────────────────
  async function saveMediaForProduct(targetId, uploadedItems) {
    if (!targetId || !uploadedItems?.length) return;
    console.log(`[Form] Saving ${uploadedItems.length} media items for product ${targetId}`);

    try {
      const url = `/api/admin/media/save`;
      console.log("[Axios] Calling:", url);
      const { data } = await axios.post(url, {
        product_id: targetId,
        media: uploadedItems,
      });

      if (!data.success) {
        console.error("[Axios] Error at:", url, data);
        alert(data.error || "Failed to save media.");
      } else {
        console.log("[Form] Media saved:", data);
      }

    } catch (err) {
      console.error("[Axios] Error at:", `/api/admin/media/save`, err);
      alert(err.response?.data?.error || "Failed to save media.");
    }
  }

  // ────────────────────────────────
  // Submit Handler
  // ────────────────────────────────
  async function onSubmit(formData) {
    try {
      const payload = { ...formData };
      if (derivedImageUrl) payload.image_url = derivedImageUrl;
      console.log("[Form] payload being sent:", payload);

      let newId = productId;

      if (productId) {
        // 🟩 EDIT EXISTING PRODUCT
        const url = `/api/admin/manage_products/${productId}`;
        console.log("[Axios] Calling:", url);
        const { data } = await axios.put(url, payload);
        const merged = { id: Number(productId), ...payload, ...(data?.product || {}) };
        dispatch(updateProductInStore(merged));
        newId = productId;
        alert("Product updated successfully!");

        // Save any newly uploaded media (if any)
        if (pendingMedia.length > 0) {
          await saveMediaForProduct(newId, pendingMedia);
          setPendingMedia([]);
        }
      } else {
        // 🆕 CREATE PRODUCT + MEDIA TOGETHER
        const url = `/api/products/create_with_media`;
        console.log("[Axios] Calling:", url);
        const createPayload = {
          ...payload,
          media: pendingMedia || [],
        };

        const { data } = await axios.post(url, createPayload);
        console.log("[Form] create_with_media returned:", data);

        if (data?.productId) {
          newId = data.productId;
          alert(`✅ Product & media created (id=${newId})`);
        } else {
          alert("⚠️ Product created but ID missing in response.");
        }

        setPendingMedia([]);
      }

      router.push("/admin/admin_inventory");
    } catch (err) {
      console.error("[Axios] Error during form submit:", err);
      alert(`Failed to save product: ${err.response?.data?.error || err.message}`);
    }
  }
  // ────────────────────────────────
  // Delete Media Instantly
  // ────────────────────────────────
  async function handleDeleteMedia(mediaItem) {
    if (!mediaItem?.public_id) return;

    try {
      console.log("[Media] Deleting:", mediaItem.public_id);
      const { data } = await axios.post("/api/admin/media/delete", {
        public_id: mediaItem.public_id,
      });

      if (data.success) {
        console.log("[Media] Deleted:", mediaItem.public_id);
        setMedia((prev) => prev.filter((m) => m.public_id !== mediaItem.public_id));
      } else {
        console.warn("[Media] Delete failed:", data.error);
      }
    } catch (err) {
      console.error("[Axios] Error deleting media:", err);
    }
  }


  // ────────────────────────────────
  // Render
  // ────────────────────────────────
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <BasicsFields register={register} errors={errors} />
      <PriceStockFields register={register} errors={errors} />
      <CategoryDescription register={register} />

      <div className="text-xs text-gray-500">
        Debug → productId prop: <b>{String(productId)}</b> | product?.id: <b>{String(product?.id)}</b>
      </div>

      <MediaSection
        productId={productId || product?.id}
        media={media}
        onMediaChange={handleMediaChange}
        onDeleteMedia={handleDeleteMedia}
        loading={loadingMedia}
      />

      <button
        type="submit"
        className="bg-blue-600 text-white py-2 px-4 rounded-md disabled:bg-gray-400"
      >
        {productId ? "Update Product" : "Add Product"}
      </button>
    </form>
  );
}




