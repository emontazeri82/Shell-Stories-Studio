"use client";

import { useState, useEffect } from "react";
import ProductMediaManager from "@/components/admin_dashboard/ProductMediaManager";
import ProductMediaGallery from "@/components/media/ProductMediaGallery";

export default function MediaSection({ productId, media: initialMedia = [], onMediaChange: parentOnMediaChange, loading }) {
  const [media, setMedia] = useState(initialMedia);
  const [status, setStatus] = useState("idle"); // idle | uploading | saving | done | error

  // If parent passes new media prop, sync it
  useEffect(() => {
    setMedia(initialMedia);
  }, [initialMedia]);

  const handleMediaChange = (uploadedItems) => {
    console.log("[MediaSection] 🔄 onMediaChange triggered:", uploadedItems);
    setMedia(prev => [...uploadedItems, ...(prev || [])]);
    // notify parent if provided
    if (typeof parentOnMediaChange === "function") {
      parentOnMediaChange(uploadedItems);
    }
    // update status
    setStatus("done");
    // optionally reset status after short delay
    setTimeout(() => setStatus("idle"), 3000);
  };

  return (
    <div className="pt-6 border-t border-zinc-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium">Media</h3>
      </div>

      {!productId && (
        <div className="border rounded p-3">
          <div className="text-sm text-gray-600">
            💡 Save the product first to enable media uploads.
          </div>
        </div>
      )}

      {productId && (
        <>
          <ProductMediaManager
            productId={productId}
            onMediaChange={async (uploaded) => {
              setStatus("uploading");
              try {
                await handleMediaChange(uploaded);
              } catch (err) {
                console.error("[MediaSection] Error handling media change:", err);
                setStatus("error");
              }
            }}
          />

          {/* status cues */}
          {status === "uploading" && (
            <p className="text-sm text-gray-500 mt-3">⏳ Uploading media…</p>
          )}
          {status === "done" && (
            <p className="text-sm text-green-600 mt-3">✅ Media saved successfully!</p>
          )}
          {status === "error" && (
            <p className="text-sm text-red-600 mt-3">❌ Failed to save media — try again.</p>
          )}

          {loading && <p className="text-sm text-gray-500 mt-3">Loading media…</p>}

          {!loading && media.length === 0 && (
            <p className="text-sm text-zinc-500 mt-3">
              No media yet. Use the upload field above to add images or videos.
            </p>
          )}

          {!loading && media.length > 0 && (
            <div className="mt-4">
              <ProductMediaGallery media={media} />
            </div>
          )}
        </>
      )}
    </div>
  );
}


