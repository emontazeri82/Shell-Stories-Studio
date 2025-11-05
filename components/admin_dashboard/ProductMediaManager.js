"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import axios from "axios";
import { directCloudinaryUpload } from "@/lib/adminApi/cloudinaryClientUpload";

export default function ProductMediaManager({ productId, onSaved, onMediaChange }) {
  const [phase, setPhase] = useState("idle"); // idle | uploading | saving | done | error
  const [progressMap, setProgressMap] = useState({});
  const [errors, setErrors] = useState([]);

  const abortControllerRef = useRef(null);
  const isMountedRef = useRef(true);
  const sessionRef = useRef(Math.random().toString(36).slice(2)); // temp folder key

  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET;

  // ────────────────────────────────
  // Cleanup when unmounting
  // ────────────────────────────────
  useEffect(() => {
    return () => {
      isMountedRef.current = false;
      if (abortControllerRef.current && phase === "uploading") {
        console.warn("[Upload] ⚠️ Component unmounted mid-upload — aborting.");
        abortControllerRef.current.abort();
      }
    };
  }, [phase]);

  // ────────────────────────────────
  // File selection + upload
  // ────────────────────────────────
  const onFileChange = useCallback(
    async (e) => {
      const files = Array.from(e.target.files || []);
      console.log("[Uploader] onFileChange productId=", productId, "files:", files.map(f => f.name));

      if (files.length === 0) return;

      const folder = productId
        ? `products/${productId}`
        : `products/temp/${sessionRef.current}`;

      const allowedTypes = [
        "image/jpeg",
        "image/png",
        "image/jpg",
        "video/mp4",
        "video/quicktime",
      ];
      const maxSizeBytes = 50 * 1024 * 1024;
      const invalid = files.filter(
        (f) => f.size > maxSizeBytes || !allowedTypes.includes(f.type)
      );

      if (invalid.length > 0) {
        alert(
          `Some files are invalid (max ${
            maxSizeBytes / (1024 * 1024)
          } MB, allowed: ${allowedTypes.join(", ")}): ${invalid
            .map((f) => f.name)
            .join(", ")}`
        );
        e.target.value = "";
        return;
      }

      const concurrency = Math.min(3, files.length);
      setPhase("uploading");
      setProgressMap({});
      setErrors([]);

      const failed = [];
      const uploaded = [];
      const queue = files.slice();
      const controller = new AbortController();
      abortControllerRef.current = controller;

      console.groupCollapsed(
        `[Upload] 🚀 Starting batch folder=${folder} (${files.length} files)`
      );
      console.log("Cloudinary config:", { cloudName, uploadPreset });

      async function worker(workerIndex) {
        while (queue.length) {
          const file = queue.shift();
          if (!file) continue;

          console.log(`[Worker ${workerIndex}] Upload start: ${file.name}`);
          try {
            const resp = await directCloudinaryUpload({
              file,
              cloudName,
              uploadPreset,
              folder,
              tags: ["product", `session-${sessionRef.current}`],
              onProgress: (pct) => {
                if (!isMountedRef.current) return;
                setProgressMap((prev) => ({
                  ...prev,
                  [file.name]: Math.floor(pct || 0),
                }));
              },
              signal: controller.signal,
            });

            console.log(`[Worker ${workerIndex}] ✅ Uploaded:`, resp.secure_url);

            uploaded.push({
              secure_url: resp.secure_url,
              public_id: resp.public_id,
              kind: resp.resource_type,
              format: resp.format,
              width: resp.width,
              height: resp.height,
              duration: resp.duration ?? null,
              bytes: resp.bytes,
              folder,
              sort_order: 0,
              is_primary: false,
            });
          } catch (err) {
            failed.push({ file: file.name, error: err.message });
            console.error(
              `[Worker ${workerIndex}] ❌ Upload failed for ${file.name}:`,
              err.message
            );
          }
        }
      }

      const uploadStart = performance.now();
      await Promise.all(
        Array.from({ length: concurrency }, (_, i) => worker(i + 1))
      );
      const uploadEnd = performance.now();

      console.log(
        `[Upload] ⏱ Completed in ${(uploadEnd - uploadStart).toFixed(1)} ms`
      );
      console.log(`[Upload] Uploaded: ${uploaded.length}, Failed: ${failed.length}`);

      if (uploaded.length > 0) {
        console.log("✅ Upload batch complete. Passing to parent onMediaChange...");
        onMediaChange?.(uploaded);
        setPhase("done");
      } else {
        console.warn("[Upload] No successful uploads to save.");
        setPhase("idle");
      }

      abortControllerRef.current = null;
      if (e.target) e.target.value = "";
      if (failed.length) {
        console.table(failed);
        setErrors(failed);
      }

      setTimeout(() => {
        if (isMountedRef.current) {
          setProgressMap({});
          setPhase("idle");
        }
      }, 2000);
    },
    [productId, cloudName, uploadPreset, onMediaChange]
  );

  // ────────────────────────────────
  // Cancel uploads
  // ────────────────────────────────
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

  // ────────────────────────────────
  // Render
  // ────────────────────────────────
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
        {phase === "done" && (
          <span className="text-sm text-green-600">
            ✅ Media uploaded successfully!
          </span>
        )}
        {phase === "error" && (
          <span className="text-sm text-red-600">
            ❌ Upload failed — try again.
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





