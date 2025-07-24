// components/admin_dashboard/ProductList/BulkUpdateModal.js
import { Fragment, useState } from 'react';
import { Dialog, Transition } from '@headlessui/react';

const CLOUD_NAME = 'dr5v7f0wd';
const UPLOAD_PRESET = 'unsigned_upload';

export default function BulkUpdateModal({ isOpen, onClose, onSave, field }) {
  const [value, setValue] = useState('');
  const [uploading, setUploading] = useState(false);
  const [imageUrl, setImageUrl] = useState('');

  const fieldLabel = {
    price: 'Price',
    category: 'Category',
    description: 'Description',
    image: 'Image',
    favorite: 'Favorite (0 or 1)',
  }[field];

  const handleImageUpload = async (e) => {
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

  const handleSubmit = () => {
    let payload;
  
    if (field === 'image') {
      if (!imageUrl) return alert('Please upload an image');
      payload = { image_url: imageUrl }; // Use correct DB field name
    } else {
      if (!value.trim()) return alert('Please provide a value');
      payload = { [field]: value.trim() };
    }
  
    onSave(payload);  // ✅ Pass full object, not just value
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
          <div className="fixed inset-0 bg-black bg-opacity-40" />
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


            {field === 'image' ? (
              <>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="w-full mb-4"
                />
                {imageUrl && (
                  <img
                    src={imageUrl}
                    alt="Preview"
                    className="w-24 h-24 object-cover rounded border mb-4"
                  />
                )}
              </>
            ) : (
              <input
                type={field === 'price' ? 'number' : 'text'}
                placeholder={`Enter ${fieldLabel}`}
                value={value}
                onChange={(e) => setValue(e.target.value)}
                className="w-full border p-2 rounded mb-4"
              />
            )}
            <div className="flex justify-end gap-2">
              <button
                className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
                onClick={onClose}
              >
                Cancel
              </button>
              <button
                className="bg-blue-600 text-white px-4 py-2 rounded"
                onClick={handleSubmit}
              >
                Save
              </button>
            </div>
          </Dialog.Panel>
        </Transition.Child>
      </Dialog>
    </Transition>
  );
}
