"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { directCloudinaryUpload } from "@/lib/adminApi/cloudinaryClientUpload";

export default function ProductMediaManager({ productId, onSaved, onMediaChange }) {
  const [phase, setPhase] = useState("idle"); // idle | uploading | saving | done | error
  const [progressMap, setProgressMap] = useState({});
  const [errors, setErrors] = useState([]);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current && phase === "uploading") {
        console.warn("[Upload] ⚠️ component unmounted during upload — aborting.");
        abortControllerRef.current.abort();
      }
    };
  }, [phase]);

  const onFileChange = useCallback(async (e) => {
    const files = Array.from(e.target.files || []);
    console.log("[Uploader] onFileChange productId=", productId, "files:", files.map(f => f.name));
  
    if (files.length === 0) {
      return;
    }
    if (!productId) {
      alert("No product selected for upload.");
      e.target.value = "";
      return;
    }
  
    const allowedTypes = ["image/jpeg", "image/png", "image/jpg", "video/mp4", "video/quicktime"];
    const maxSizeBytes = 50 * 1024 * 1024;
    const invalid = files.filter(f => f.size > maxSizeBytes || !allowedTypes.includes(f.type));
  
    if (invalid.length > 0) {
      alert(`Some files are invalid (max ${maxSizeBytes / (1024*1024)} MB, allowed types: ${allowedTypes.join(", ")}): ${invalid.map(f => f.name).join(", ")}`);
      e.target.value = "";
      return;
    }
  
    const folder = `products/${productId}`;
    const concurrency = Math.min(3, files.length);
  
    setPhase("uploading");
    setProgressMap({});
    setErrors([]);
  
    const failed = [];
    const uploaded = [];
    const queue = files.slice();
    const controller = new AbortController();
    abortControllerRef.current = controller;
  
    console.groupCollapsed(`[Upload] 🚀 Starting batch product=${productId} (${files.length} files)`);
    console.log("Cloudinary config:", { cloudName, uploadPreset });
    console.log("Files to upload:", files.map(f => f.name));
  
    async function worker(workerIndex) {
      while (queue.length) {
        const file = queue.shift();
        if (!file) continue;
        console.log(`[Worker ${workerIndex}] Upload start: ${file.name}`);
        const t0 = performance.now();
        try {
          const resp = await directCloudinaryUpload({
            file,
            cloudName,
            uploadPreset,
            folder,
            tags: ["product", `product-${productId}`],
            onProgress: (pct) => {
              if (!isMountedRef.current) return;
              setProgressMap(prev => ({ ...prev, [file.name]: pct == null ? 0 : Math.floor(pct) }));
            },
            signal: controller.signal,
          });
          const t1 = performance.now();
          console.log(`[Worker ${workerIndex}] ✅ Upload done (${(t1 - t0).toFixed(0)} ms):`, resp.secure_url);
  
          uploaded.push({
            url: resp.secure_url,
            publicId: resp.public_id,
            resourceType: resp.resource_type,
            format: resp.format,
            bytes: resp.bytes,
            width: resp.width,
            height: resp.height,
            duration: resp.duration ?? null,
            originalFilename: file.name,
            folder,
            sort_order: 0,
          });
        } catch (err) {
          const msg = err?.message || String(err);
          failed.push({ file: file.name, error: msg });
          console.error(`[Worker ${workerIndex}] ❌ Error uploading (${file.name}):`, msg);
        }
      }
    }
  
    const uploadStart = performance.now();
    await Promise.all(Array.from({ length: concurrency }, (_, i) => worker(i + 1)));
    const uploadEnd = performance.now();
    console.log(`[Upload] ⏱ Completed in ${(uploadEnd - uploadStart).toFixed(1)} ms`);
    console.log(`[Upload] Uploaded: ${uploaded.length}, Failed: ${failed.length}`);
  
    if (uploaded.length > 0) {
      setPhase("saving");
      console.groupCollapsed("[Upload] 💾 Saving to DB…");
      const saveStart = performance.now();
  
      try {
        const payload = JSON.stringify({ media: uploaded });
        console.log("Payload sample:", uploaded[0]);
        const fetchUrl = `/api/admin/media/save?productId=${encodeURIComponent(productId)}`;
        console.log("Fetch URL:", fetchUrl);
  
        const watchdog = setTimeout(() => {
          console.warn("⚠️ DB save taking >10s");
        }, 10000);
  
        const res = await fetch(fetchUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
        });
  
        clearTimeout(watchdog);
        console.log("DB Save HTTP status:", res.status);
  
        const data = await res.json();
        console.log("DB Save JSON:", data);
  
        const ok = res.ok && (data.success === true || data.success === "true");
        console.log("📦 Response success field type:", typeof data.success, "value:", data.success);
  
        if (!ok) {
          console.error("⚠️ Unexpected response:", data);
          throw new Error(`media/save failed (${res.status}): ${data?.message || data?.error || "Unknown error"}`);
        }
  
        console.log("✅ DB save succeeded");
        onMediaChange?.(uploaded);
        onSaved?.(uploaded);
        setPhase("done");
  
        const saveEnd = performance.now();
        console.log(`💾 DB save took ${(saveEnd - saveStart).toFixed(1)} ms`);
      } catch (err) {
        console.error("[Upload] 💥 DB save error:", err);
        setPhase("error");
        failed.push({ file: "(persist)", error: err.message });
      } finally {
        console.groupEnd();
        abortControllerRef.current = null;
        if (e.target) e.target.value = "";
  
        if (isMountedRef.current) {
          if (failed.length) console.table(failed);
          setTimeout(() => {
            if (isMountedRef.current) setPhase("idle");
          }, 3000);
        }
      }
    } else {
      console.warn("[Upload] No successful uploads to save.");
      setPhase("idle");
      abortControllerRef.current = null;
      if (e.target) e.target.value = "";
    }
  
  }, [productId, cloudName, uploadPreset, onSaved, onMediaChange]);
  

  const cancelUploads = () => {
    if (phase !== "uploading") {
      console.log(`[Upload] Cancel ignored — phase=${phase}`);
      return;
    }
    console.warn("[Upload] ⛔ User cancelled.");
    abortControllerRef.current?.abort();
    abortControllerRef.current = null;
    setProgressMap({});
    setPhase("idle");
  };

  const inputDisabled = phase === "uploading" || phase === "saving";
  if (typeof onFileChange !== "function") {
    console.error("❌ onFileChange is undefined inside ProductMediaManager!");
  }
  
  return (
    <div className="space-y-4 border p-3 rounded-md bg-white shadow-sm">
      <div className="flex items-center gap-3">
        <input
          type="file"
          multiple
          accept="image/*,video/*"
          onChange={onFileChange}
          disabled={inputDisabled}
          className="text-sm"
        />
        {phase === "uploading" && (
          <button
            type="button"
            onClick={cancelUploads}
            className="px-3 py-1 rounded bg-red-600 text-white text-sm"
          >
            Cancel
          </button>
        )}
        {phase === "saving" && (
          <span className="text-sm text-zinc-600 animate-pulse">
            💾 Saving to database…
          </span>
        )}
        {phase === "done" && (
          <span className="text-sm text-green-600">
            ✅ Media saved successfully!
          </span>
        )}
        {phase === "error" && (
          <span className="text-sm text-red-600">
            ❌ Failed to save media — try again.
          </span>
        )}
      </div>

      {!!Object.keys(progressMap).length && (
        <ul className="space-y-2">
          {Object.entries(progressMap).map(([name, pct]) => (
            <li key={name} className="text-sm">
              <div className="flex justify-between">
                <span className="truncate max-w-[60%]">{name}</span>
                <span>{pct == null ? "…" : `${pct}%`}</span>
              </div>
              <div className="h-2 bg-gray-200 rounded">
                <div
                  className="h-2 bg-blue-600 rounded transition-all"
                  style={{ width: `${pct ?? 0}%` }}
                />
              </div>
            </li>
          ))}
        </ul>
      )}

      {errors.length > 0 && (
        <div className="text-sm text-red-600">
          <div className="font-semibold mb-1">❌ Some uploads failed:</div>
          <ul className="list-disc ml-5 space-y-1">
            {errors.map((e, i) => (
              <li key={i}>
                <span className="font-mono">{e.file}</span>: {e.error}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
}






