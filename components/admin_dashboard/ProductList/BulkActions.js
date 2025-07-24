// components/admin_dashboard/ProductList/BulkActions.js
import { FaTrash, FaToggleOn, FaToggleOff, FaDollarSign, FaTags, FaStar, FaImage, FaInfoCircle } from 'react-icons/fa';
import IconTooltipButton from '@/components/ui/IconTooltipButton';

export default function BulkActions({ selected, onBulkDelete, onBulkActivate, onBulkUpdate }) {
  return (
    <div className="mb-4 flex items-center gap-3 bg-yellow-100 p-2 rounded shadow-sm">
      <span className="font-medium text-gray-800">{selected.length} selected</span>

      {/* Delete */}
      <IconTooltipButton
        icon={FaTrash}
        label="Delete Selected"
        onClick={onBulkDelete}
        className="bg-red-500 text-white"
      />

      {/* Activate */}
      <IconTooltipButton
        icon={FaToggleOn}
        label="Activate Selected"
        onClick={() => onBulkActivate(1)}
        className="bg-green-600 text-white"
      />

      {/* Deactivate */}
      <IconTooltipButton
        icon={FaToggleOff}
        label="Deactivate Selected"
        onClick={() => onBulkActivate(0)}
        className="bg-gray-600 text-white"
      />

      {/* Update Price */}
      <IconTooltipButton
        icon={FaDollarSign}
        label="Update Price"
        onClick={() => onBulkUpdate('price')}
      />

      {/* Update Category */}
      <IconTooltipButton
        icon={FaTags}
        label="Update Category"
        onClick={() => onBulkUpdate('category')}
      />

      {/* Update Description */}
      <IconTooltipButton
        icon={FaInfoCircle}
        label="Update Description"
        onClick={() => onBulkUpdate('description')}
      />

      {/* Update Image */}
      <IconTooltipButton
        icon={FaImage}
        label="Update Image"
        onClick={() => onBulkUpdate('image')}
      />

      {/* Toggle Favorite */}
      <IconTooltipButton
        icon={FaStar}
        label="Toggle Favorite"
        onClick={() => onBulkUpdate('favorite')}
      />
    </div>
  );
}

  