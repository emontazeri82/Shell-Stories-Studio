export default function LegacyImageUploader({ uploading, onPick, imageUrl }) {
  const hasImage = Boolean(imageUrl && imageUrl.trim() !== "");

  return (
    <div className="border rounded p-3">
      <div className="font-medium mb-2">Main Image (optional / legacy)</div>

      <input
        type="file"
        accept="image/*"
        className="p-2 border rounded w-full"
        onChange={(e) => onPick?.(e.target.files?.[0] || null)}
      />

      {uploading && <p className="text-blue-500 mt-2">Uploading image…</p>}

      {hasImage ? (
        <div className="mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={imageUrl}
            alt="Uploaded image"
            className="h-24 border rounded object-cover"
          />
        </div>
      ) : (
        <p className="text-sm text-gray-400 mt-1">No image selected.</p>
      )}

      <p className="text-xs text-gray-500 mt-2">
        If you don’t pick one, the first image in “Media” will be used when saving.
      </p>
    </div>
  );
}

  