import { useEffect, useMemo, useState } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { useDispatch } from 'react-redux';
import { createProduct, updateProductById } from '@/lib/adminApi/productActions';
import { updateProductInStore } from '@/redux/slices/productsSlice';
import fetchJSON from '@/lib/fetchJSON';

import BasicsFields from './parts/BasicsFields';
import PriceStockFields from './parts/PriceStockFields';
import CategoryDescription from './parts/CategoryDescription';
import LegacyImageUploader from './parts/LegacyImageUploader';
import MediaSection from './parts/MediaSection';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME || 'dr5v7f0wd';
const UPLOAD_PRESET = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET || 'unsigned_upload';

export default function ProductForm({ productId }) {
  const router = useRouter();
  const dispatch = useDispatch();

  const [product, setProduct] = useState(null);
  const [media, setMedia] = useState([]);
  const [loadingProduct, setLoadingProduct] = useState(!!productId);
  const [loadingMedia, setLoadingMedia] = useState(!!productId);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const { register, handleSubmit, formState: { errors }, reset } = useForm();

  // Load product basics
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingProduct(true);
        const data = await fetchJSON(`/api/admin/manage_products/${productId}`);
        if (cancelled) return;
        if (data?.product) {
          setProduct(data.product);
          reset({ ...data.product, image_url: data.product.image_url || '' });
          setImageUrl(data.product.image_url || '');
        } else {
          alert('Product not found.');
          router.replace('/admin/admin_inventory');
        }
      } catch (err) {
        alert(`Failed to load product: ${err.message}`);
        router.replace('/admin/admin_inventory');
      } finally {
        if (!cancelled) setLoadingProduct(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productId, reset, router]);

  // Load media (public endpoint)
  useEffect(() => {
    if (!productId) return;
    let cancelled = false;

    (async () => {
      try {
        setLoadingMedia(true);
        const d = await fetchJSON(`/api/products/${productId}/media`);
        if (cancelled) return;
        setMedia(Array.isArray(d?.items) ? d.items : []);
      } catch {
        if (!cancelled) setMedia([]);
      } finally {
        if (!cancelled) setLoadingMedia(false);
      }
    })();

    return () => { cancelled = true; };
  }, [productId]);

  const firstImageUrl = useMemo(() => {
    const primary = media.find(m => m.is_primary && m.kind === 'image');
    const first = media.find(m => m.kind === 'image');
    return (primary || first)?.secure_url || '';
  }, [media]);

  // Single (optional) unsigned Cloudinary upload
  async function uploadMainImage(file) {
    const fd = new FormData();
    fd.append('file', file);
    fd.append('upload_preset', UPLOAD_PRESET);

    const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
      method: 'POST',
      body: fd,
    });
    const txt = await res.text();
    if (!res.ok) throw new Error(txt.slice(0, 180) || `HTTP ${res.status}`);

    const data = JSON.parse(txt);
    if (!data?.secure_url) throw new Error(data?.error?.message || 'Upload did not include secure_url');
    return data.secure_url;
  }

  async function onSubmit(formData) {
    try {
      const fallback = firstImageUrl || '';
      const payload = { ...formData, ...(imageUrl || fallback ? { image_url: imageUrl || fallback } : {}) };

      if (productId) {
        const updated = await updateProductById(productId, payload);
        const merged = { id: Number(productId), ...payload, ...(updated?.product || {}) };
        dispatch(updateProductInStore(merged));
      } else {
        await createProduct(payload);
      }

      alert('Product saved successfully');
      router.push('/admin/admin_inventory');
    } catch (err) {
      alert(`Failed to save product: ${err.message}`);
    }
  }

  if (loadingProduct && productId) {
    return <div>Loading product…</div>;
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      <BasicsFields register={register} errors={errors} />

      <PriceStockFields register={register} errors={errors} />

      <CategoryDescription register={register} />

      <LegacyImageUploader
        uploading={uploading}
        onPick={async (file) => {
          if (!file) return;
          if (file.size > 10 * 1024 * 1024) {
            alert('File too large (max 10MB)');
            return;
          }
          try {
            setUploading(true);
            const url = await uploadMainImage(file);
            setImageUrl(url);
          } catch (e) {
            alert(`Image upload failed: ${e.message}`);
          } finally {
            setUploading(false);
          }
        }}
        imageUrl={imageUrl}
      />

      <MediaSection
        productId={productId}
        media={media}
        onMediaChange={setMedia}
        loading={loadingMedia}
      />

      <button
        type="submit"
        disabled={uploading}
        className="bg-blue-600 text-white py-2 px-4 rounded-md disabled:bg-gray-400"
      >
        {productId ? 'Update Product' : 'Add Product'}
      </button>
    </form>
  );
}
