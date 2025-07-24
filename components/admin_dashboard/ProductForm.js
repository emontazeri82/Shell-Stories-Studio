// components/admin_dashboard/ProductForm.js
import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import {
  createProduct,
  updateProductById
} from '@/lib/adminApi/productActions';

const CLOUD_NAME = 'dr5v7f0wd'; // 🔁 Your Cloudinary cloud name
const UPLOAD_PRESET = 'unsigned_upload'; // 🔁 Must match your Cloudinary unsigned preset

const ProductForm = ({ productId }) => {
  const router = useRouter();
  const [product, setProduct] = useState(null);
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm();

  useEffect(() => {
    if (productId) {
      console.log('🔍 Fetching product with ID:', productId);
      const fetchProduct = async () => {
        try {
          const res = await fetch(`/api/admin/manage_products/${productId}`);
          const data = await res.json();
          if (data?.product) {
            setProduct(data.product);
            reset(data.product);
            setImageUrl(data.product.image_url || '');
          }
        } catch (err) {
          console.error('❌ Failed to load product:', err);
        }
      };

      fetchProduct();
    }
  }, [productId, reset]);

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.size > 10 * 1024 * 1024) {
      alert('File too large (max 10MB)');
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append('file', file);
    formData.append('upload_preset', UPLOAD_PRESET);

    try {
      const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`, {
        method: 'POST',
        body: formData,
      });

      const data = await res.json();
      console.log("🧾 Cloudinary Response:", data);
      if (data?.secure_url) {
        setImageUrl(data.secure_url);
      } else {
        throw new Error('Upload response did not include secure_url');
      }
    } catch (err) {
      console.error('❌ Image upload failed:', err);
      alert('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = async (formData) => {
    try {
      if (!imageUrl) {
        alert('Please upload an image before submitting.');
        return;
      }

      formData.imageUrl = imageUrl;

      if (productId) {
        await updateProductById(productId, formData);
      } else {
        await createProduct(formData);
      }

      alert('Product saved successfully');
      router.push('/admin/admin_inventory');
    } catch (err) {
      console.error('❌ Product save failed:', err);
      alert('Failed to save product.');
    }
  };

  if (!product && productId) return <div>Loading product...</div>;

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div>
        <label htmlFor="name" className="block">Product Name</label>
        <input
          {...register('name', { required: 'Name is required' })}
          id="name"
          type="text"
          className="p-2 border rounded w-full"
        />
        {errors.name && <p className="text-red-500">{errors.name.message}</p>}
      </div>

      <div>
        <label htmlFor="price" className="block">Price</label>
        <input
          {...register('price', {
            required: 'Price is required',
            valueAsNumber: true,
            pattern: {
              value: /^\d+(\.\d{1,2})?$/,
              message: 'Only numbers with up to 2 decimal places allowed',
            }
          })}
          id="price"
          type="number"
          step="0.01"
          className="p-2 border rounded w-full"
        />
        {errors.price && <p className="text-red-500">{errors.price.message}</p>}
      </div>

      <div>
        <label htmlFor="description" className="block">Description</label>
        <textarea
          {...register('description')}
          id="description"
          className="p-2 border rounded w-full"
        />
      </div>

      <div>
        <label htmlFor="imageUpload" className="block">Upload Image</label>
        <input
          type="file"
          accept="image/*"
          onChange={handleImageChange}
          className="p-2 border rounded w-full"
        />
        {uploading && <p className="text-blue-500 mt-2">Uploading image...</p>}
        {imageUrl && (
          <div className="mt-2">
            <img src={imageUrl} alt="Uploaded" className="h-24 border rounded" />
          </div>
        )}
        {!imageUrl && !uploading && (
          <p className="text-sm text-gray-400 mt-1">No image selected.</p>
        )}
      </div>

      <div>
        <label htmlFor="category" className="block">Category</label>
        <select
          {...register('category')}
          id="category"
          className="p-2 border rounded w-full"
        >
          <option value="floral">Floral</option>
          <option value="bird">Bird</option>
          <option value="decor">Decor</option>
        </select>
      </div>

      <div>
        <label htmlFor="stock" className="block">Stock</label>
        <input
          {...register('stock', { valueAsNumber: true })}
          id="stock"
          type="number"
          className="p-2 border rounded w-full"
          placeholder="Default: 0"
        />
      </div>

      <button
        type="submit"
        disabled={uploading}
        className="bg-blue-500 text-white py-2 px-4 rounded-md disabled:bg-gray-400"
      >
        {productId ? 'Update Product' : 'Add Product'}
      </button>
    </form>
  );
};

export default ProductForm;

