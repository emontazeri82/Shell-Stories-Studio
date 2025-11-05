"use client";

import { useState, useEffect, useRef } from "react";
import ProductMediaManager from "@/components/admin_dashboard/ProductMediaManager";
import ProductMediaGallery from "@/components/media/ProductMediaGallery";

export default function MediaSection({
  productId,
  media: initialMedia = [],
  onMediaChange: parentOnMediaChange,
  onDeleteMedia,
  loading,
}) {
  const [media, setMedia] = useState(initialMedia);
  const [status, setStatus] = useState("idle"); // idle | uploading | saving | done | error
  const resetTimerRef = useRef(null);

  // 🔹 Sync new media from parent props
  useEffect(() => {
    try {
      console.log("[MediaSection] Checking for media updates...");
      setMedia((prev) => {
        if (JSON.stringify(prev) !== JSON.stringify(initialMedia)) {
          console.log("[MediaSection] Updating local media state from props.");
          return initialMedia;
        }
        return prev;
      });
    } catch (err) {
      console.error("[MediaSection] Error syncing media:", err);
    }
  }, [initialMedia]);

  // 🔹 Handle new uploads from ProductMediaManager
  const handleMediaChange = (uploadedItems) => {
    try {
      console.log("[MediaSection] 🔄 onMediaChange triggered:", uploadedItems);
      setMedia((prev) => [...uploadedItems, ...(prev || [])]);

      if (typeof parentOnMediaChange === "function") {
        console.log("[MediaSection] Calling parent onMediaChange callback.");
        parentOnMediaChange(uploadedItems);
      }

      setStatus("done");

      if (resetTimerRef.current) clearTimeout(resetTimerRef.current);
      resetTimerRef.current = setTimeout(() => setStatus("idle"), 3000);
    } catch (err) {
      console.error("[MediaSection] Error handling media change:", err);
      setStatus("error");
    }
  };

  return (
    <div className="pt-6 border-t border-zinc-200">
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-base font-medium">Media</h3>
      </div>

      {/* 🔹 When productId is missing */}
      {!productId && (
        <div className="border rounded p-3 bg-blue-50 text-sm text-gray-700 mb-2">
          💡 You’re creating a new product — media will be saved automatically after creation.
        </div>
      )}


      {/* 🔹 When productId exists */}

      <ProductMediaManager
        productId={productId}
        onMediaChange={(uploaded) => {
          console.log("[MediaSection] Upload started...");
          setStatus("uploading");
          try {
            handleMediaChange(uploaded);
          } catch (err) {
            console.error(
              "[MediaSection] Error during ProductMediaManager onMediaChange:",
              err
            );
            setStatus("error");
          }
        }}
      />

      {/* 🔹 Status messages */}
      {status === "uploading" && (
        <p className="text-sm text-gray-500 mt-3">⏳ Uploading media…</p>
      )}
      {status === "done" && (
        <p className="text-sm text-green-600 mt-3">
          ✅ Media saved successfully!
        </p>
      )}
      {status === "error" && (
        <p className="text-sm text-red-600 mt-3">
          ❌ Failed to save media — try again.
        </p>
      )}

      {/* 🔹 Loading or gallery states */}
      {loading && (
        <p className="text-sm text-gray-500 mt-3">Loading media…</p>
      )}

      {!loading && media.length === 0 && (
        <p className="text-sm text-zinc-500 mt-3">
          No media yet. Use the upload field above to add images or videos.
        </p>
      )}

      {!loading && media.length > 0 && (
        <div className="mt-4">
          <ProductMediaGallery media={media} onDeleteMedia={onDeleteMedia} />
        </div>
      )}
  )
    </div >
  );
}


