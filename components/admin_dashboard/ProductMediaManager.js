// components/admin_dashboard/ProductMediaManager.js
import { useEffect, useMemo, useState, useCallback } from "react";
import {
  fetchProductMedia,
  uploadAssetToCloudinary,
  attachMedia,
  deleteMedia,
  updateMedia,
} from "@/lib/adminApi/mediaActions";

// ------------------------- small utils -------------------------
const now = () => performance.now();
const took = (t0) => `${Math.round(performance.now() - t0)}ms`;

function normalizeUpload(up) {
  // Tolerate casing differences from Cloudinary or your wrapper
  const resourceType = up.resourceType || up.resource_type || "";
  const publicId = up.publicId || up.public_id || "";
  const url = up.url || up.secure_url || "";
  return {
    resourceType,
    publicId,
    url,
    format: up.format ?? null,
    width: up.width ?? null,
    height: up.height ?? null,
    duration: up.duration ?? null,
  };
}

// ------------------------- UI bits (inline) -------------------------
function UploadButton({ disabled, onChange }) {
  return (
    <label className="inline-flex items-center gap-2 text-sm font-medium px-3 py-2 rounded-md bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-800 dark:hover:bg-zinc-700 cursor-pointer">
      <input
        type="file"
        accept="image/*,video/*"
        multiple
        className="hidden"
        onChange={onChange}
        disabled={disabled}
      />
      Upload…
    </label>
  );
}

function MediaThumb({ item }) {
  return (
    <div className="aspect-video bg-zinc-100 dark:bg-zinc-800">
      {item.kind === "video" ? (
        <video src={item.secure_url} className="h-full w-full object-cover" controls />
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={item.secure_url} alt={item.public_id} className="h-full w-full object-cover" />
      )}
    </div>
  );
}

function MediaActions({ index, total, busy, onMoveUp, onMoveDown, onSetPrimary, onDelete, isPrimary }) {
  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        className="text-[11px] px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200"
        onClick={onMoveUp}
        disabled={busy || index === 0}
        aria-label="Move up"
      >
        ↑
      </button>
      <button
        type="button"
        className="text-[11px] px-2 py-1 rounded bg-zinc-100 hover:bg-zinc-200"
        onClick={onMoveDown}
        disabled={busy || index === total - 1}
        aria-label="Move down"
      >
        ↓
      </button>
      <button
        type="button"
        className="text-[11px] px-2 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700"
        onClick={onSetPrimary}
        disabled={busy || isPrimary}
      >
        Set primary
      </button>
      <button
        type="button"
        className="text-[11px] px-2 py-1 rounded bg-red-100 text-red-700 hover:bg-red-200"
        onClick={onDelete}
        disabled={busy}
      >
        Delete
      </button>
    </div>
  );
}

// ------------------------- main component -------------------------
export default function ProductMediaManager({ productId, onMediaChange }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const canUse = Number.isInteger(Number(productId)) && Number(productId) > 0;

  const applyItems = useCallback(
    (list) => {
      setItems(list || []);
      onMediaChange?.(list || []);
    },
    [onMediaChange]
  );

  const load = useCallback(async () => {
    if (!canUse) return;
    setError("");
    const t0 = now();
    try {
      // fetchProductMedia already returns an ARRAY (not {items})
      const list = await fetchProductMedia(productId);
      console.log(`[media] fetchProductMedia(${productId}) → ${list.length} rows in ${took(t0)}`);
      applyItems(list);
    } catch (e) {
      console.error(`[media] fetchProductMedia(${productId}) failed in ${took(t0)}:`, e);
      setError(e.message || "Failed to load media");
      applyItems([]);
    }
  }, [applyItems, canUse, productId]);

  useEffect(() => {
    load();
  }, [load]);

  // ------------------------- actions -------------------------
  const onFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length || !canUse) return;

    // Optional client-side validation
    const MAX_BYTES = 50 * 1024 * 1024; // 50MB per file (bump if you need)
    for (const f of files) {
      if (f.size > MAX_BYTES) {
        setError(`"${f.name}" is too large (max ~50MB).`);
        if (e?.target) e.target.value = "";
        return;
      }
    }

    setBusy(true);
    setError("");

    const base = items?.length || 0;

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];

        // 1) Upload to your server (which uploads to Cloudinary)
        const tUp = now();
        let up = await uploadAssetToCloudinary(file, {
          productId,
          folder: `products/${productId}`,
        });
        console.log(`[media] uploadAssetToCloudinary(${file.name}) in ${took(tUp)}`, up);

        up = normalizeUpload(up);
        if (!up.url || !up.publicId) {
          throw new Error(`Upload response missing url/publicId`);
        }
        const kind = up.resourceType === "video" ? "video" : "image";

        // 2) Persist row in DB
        const tAttach = now();
        await attachMedia(productId, {
          public_id: up.publicId,
          secure_url: up.url,
          kind,
          format: up.format ?? null,
          width: up.width ?? null,
          height: up.height ?? null,
          duration: up.duration ?? null,
          sort_order: base + i,
          is_primary: 0,
        });
        console.log(`[media] attachMedia(${kind}) ok in ${took(tAttach)} → sort=${base + i}`);
      }

      await load();
      if (e?.target) e.target.value = ""; // reset input
    } catch (err) {
      console.error("[media] onFileChange failed:", err);
      setError(err.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  const setPrimary = async (mediaId) => {
    setBusy(true);
    setError("");
    const t0 = now();
    try {
      await updateMedia(productId, mediaId, { is_primary: 1 });
      console.log(`[media] setPrimary(${mediaId}) in ${took(t0)}`);
      await load();
    } catch (e) {
      console.error(`[media] setPrimary(${mediaId}) failed:`, e);
      setError(e.message || "Failed to set primary");
    } finally {
      setBusy(false);
    }
  };

  const move = async (mediaId, dir) => {
    const index = items.findIndex((m) => m.id === mediaId);
    if (index < 0) return;
    const targetIndex = index + (dir === "up" ? -1 : 1);
    if (targetIndex < 0 || targetIndex >= items.length) return;

    const a = items[index];
    const b = items[targetIndex];
    const aOrder = a.sort_order ?? index;
    const bOrder = b.sort_order ?? targetIndex;

    setBusy(true);
    setError("");
    const t0 = now();
    try {
      // swap both sides; server already resolves collisions
      await updateMedia(productId, a.id, { sort_order: bOrder });
      await updateMedia(productId, b.id, { sort_order: aOrder });
      console.log(
        `[media] move(${mediaId}, ${dir}) swapped ${a.id}:${aOrder} ↔ ${b.id}:${bOrder} in ${took(
          t0
        )}`
      );
      await load();
    } catch (e) {
      console.error(`[media] move(${mediaId}, ${dir}) failed:`, e);
      setError(e.message || "Reorder failed");
    } finally {
      setBusy(false);
    }
  };

  const remove = async (mediaId) => {
    if (!confirm("Remove this media?")) return;
    setBusy(true);
    setError("");
    const t0 = now();
    try {
      await deleteMedia(productId, mediaId);
      console.log(`[media] deleteMedia(${mediaId}) in ${took(t0)}`);
      await load();
    } catch (e) {
      console.error(`[media] deleteMedia(${mediaId}) failed:`, e);
      setError(e.message || "Delete failed");
    } finally {
      setBusy(false);
    }
  };

  // ------------------------- derived -------------------------
  const primaryId = useMemo(
    () => items.find((m) => Number(m.is_primary) === 1)?.id,
    [items]
  );

  if (!canUse) {
    return (
      <div className="p-4 rounded-lg border border-zinc-200">
        <p className="text-sm text-zinc-600">Save the product first to manage media.</p>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Media</h3>
        <UploadButton disabled={busy} onChange={onFileChange} />
      </div>

      {error && (
        <div className="text-sm text-red-600 bg-red-50 border border-red-200 rounded-md px-3 py-2">
          {error}
        </div>
      )}

      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
        {items.map((m, i) => (
          <div
            key={m.id}
            className="relative rounded-lg border border-zinc-200 overflow-hidden bg-white dark:bg-zinc-900"
          >
            <MediaThumb item={m} />

            <div className="p-2 flex items-center justify-between gap-2">
              <div className="text-xs text-zinc-600 dark:text-zinc-400">
                #{(m.sort_order ?? i) + 1} {m.kind}
                {primaryId === m.id && (
                  <span className="ml-1 inline-flex items-center rounded-full bg-emerald-100 text-emerald-700 px-2 py-0.5">
                    primary
                  </span>
                )}
              </div>

              <MediaActions
                index={i}
                total={items.length}
                busy={busy}
                isPrimary={primaryId === m.id}
                onMoveUp={() => move(m.id, "up")}
                onMoveDown={() => move(m.id, "down")}
                onSetPrimary={() => setPrimary(m.id)}
                onDelete={() => remove(m.id)}
              />
            </div>
          </div>
        ))}

        {!items.length && (
          <div className="col-span-full text-sm text-zinc-500">
            No media yet. Use “Upload…” to add images or videos.
          </div>
        )}
      </div>
    </div>
  );
}

