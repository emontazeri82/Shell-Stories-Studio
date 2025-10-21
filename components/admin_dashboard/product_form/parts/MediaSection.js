import ProductMediaManager from '@/components/admin_dashboard/ProductMediaManager';

export default function MediaSection({ productId, media, onMediaChange, loading }) {
  return (
    <div className="pt-6 border-t border-zinc-200">
      <ProductMediaManager productId={productId} onMediaChange={onMediaChange} />
      {loading && <p className="text-sm text-gray-500 mt-2">Loading media…</p>}
      {!loading && !media?.length && (
        <p className="text-sm text-zinc-500 mt-2">No media yet. Use “Upload…” to add images or videos.</p>
      )}
    </div>
  );
}
