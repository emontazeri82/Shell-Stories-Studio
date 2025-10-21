// components/admin_dashboard/ProductList/BulkUpdateModal.js
import { Fragment, useEffect, useMemo, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

const CLOUD_NAME = 'dr5v7f0wd';
const UPLOAD_PRESET = 'unsigned_upload';

export default function BulkUpdateModal({ isOpen, onClose, onSave, field }) {
  const [value, setValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  // Friendly label
  const fieldLabel = useMemo(() => ({
    price: 'Price',
    category: 'Category',
    description: 'Description',
    image: 'Image',
    favorite: 'Favorite',
    stock: 'Stock',
  }[field] ?? field), [field]);

  // Reset inputs when field changes / modal re-opens
  useEffect(() => {
    setValue('');
    setImageUrl('');
    setUploading(false);
  }, [field, isOpen]);

  const handleImageUpload = async (e) => {
    const file = e.target.files?.[0];
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
      if (!res.ok) throw new Error('Upload failed');
      const data = await res.json();
      setImageUrl(data.secure_url);
    } catch (err) {
      console.error('❌ Upload failed:', err);
      alert('Image upload failed');
    } finally {
      setUploading(false);
    }
  };

  const isNumberField = field === 'price' || field === 'stock';
  const isImageField = field === 'image';
  const isFavoriteField = field === 'favorite';
  const isCategoryField = field === 'category';

  const canSave = (() => {
    if (uploading) return false;
    if (isImageField) return Boolean(imageUrl);
    if (isFavoriteField) return value === '0' || value === '1';
    if (isNumberField) return value !== '' && !Number.isNaN(Number(value));
    return value.trim().length > 0;
  })();

  const handleSubmit = () => {
    if (!canSave) return;

    // Normalize payload keys/values
    let payload;
    if (isImageField) {
      payload = { image_url: imageUrl };
    } else if (isFavoriteField) {
      payload = { is_favorite: Number(value) === 1 ? 1 : 0 };
    } else if (isNumberField) {
      payload = { [field]: Number(value) };
    } else {
      payload = { [field]: value.trim() };
    }

    onSave(payload);
    setValue('');
    setImageUrl('');
    onClose();
  };

  return (
    <Transition show={isOpen} as={Fragment}>
      <Dialog onClose={onClose} className="fixed z-50 inset-0 flex items-center justify-center">
        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0"
          enterTo="opacity-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100"
          leaveTo="opacity-0"
        >
          <div className="fixed inset-0 bg-black/40" />
        </Transition.Child>

        <Transition.Child
          as={Fragment}
          enter="ease-out duration-200"
          enterFrom="opacity-0 scale-95"
          enterTo="opacity-100 scale-100"
          leave="ease-in duration-100"
          leaveFrom="opacity-100 scale-100"
          leaveTo="opacity-0 scale-95"
        >
          <Dialog.Panel className="bg-white p-6 rounded-lg shadow-lg max-w-md w-full z-50">
            <Dialog.Title className="text-lg font-semibold mb-4">
              Update {fieldLabel} for selected products
            </Dialog.Title>

            {/* Input area */}
            {isImageField ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full mb-4"
                  disabled={uploading}
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded border mb-4"
                  />
                )}
                {uploading && <p className="text-sm text-blue-600">Uploading…</p>}
              </>
            ) : isFavoriteField ? (
              <select
                className="w-full border p-2 rounded mb-4"
                value={value}
                onChange={(e) => setValue(e.target.value)}
              >
                <option value="">Select…</option>
                <option value="1">Mark as favorite</option>
                <option value="0">Remove favorite</option>
              </select>
            ) : isCategoryField ? (
              <>
                <select
                  className="w-full border p-2 rounded mb-2"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                >
                  <option value="">Select a category…</option>
                  <option value="floral">Floral</option>
                  <option value="bird">Bird</option>
                  <option value="decor">Decor</option>
                  {/* still allows custom via textbox below */}
                </select>
                <input
                  type="text"
                  placeholder="Or type a custom category"
                  value={value}
                  onChange={(e) => setValue(e.target.value)}
                  className="w-full border p-2 rounded"
                />
              </>
            ) : (
              <input
                type={isNumberField ? 'number' : 'text'}
                placeholder={`Enter ${fieldLabel}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border p-2 rounded mb-1"
                step={field === 'price' ? '0.01' : field === 'stock' ? '1' : undefined}
                min={field === 'stock' ? 0 : undefined}
              />
            )}

            {/* Actions */}
            <div className="flex justify-end gap-2 mt-4">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={onClose}
                disabled={uploading}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded disabled:bg-blue-300"
                onClick={handleSubmit}
                disabled={!canSave}
              >
                Save
              </button>
            </div>

            {/* Hints */}
            {isFavoriteField && (
              <p className="text-xs text-gray-500 mt-2">
                Note: You can have up to 8 favorites. If you try to mark more, only the first available will be applied.
              </p>
            )}
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}

