import { useState } from "react";

export default function AdminMediaPage() {
  const [result, setResult] = useState(null);
  const [loading, setLoading] = useState(false);

  const scanUnused = async () => {
    setLoading(true);
    const res = await fetch("/api/admin/cloudinary/cleanup-unused", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: true }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  const deleteUnused = async () => {
    if (!confirm("⚠️ This will permanently delete unused images. Continue?")) {
      return;
    }

    setLoading(true);
    const res = await fetch("/api/admin/cloudinary/cleanup-unused", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ dryRun: false }),
    });
    const data = await res.json();
    setResult(data);
    setLoading(false);
  };

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">🎞️ Media Library</h1>

      <div className="bg-white border rounded-lg p-4 shadow-sm mb-6">
        <h2 className="font-semibold mb-2">🧹 Cleanup unused Cloudinary images</h2>
        <p className="text-sm text-gray-600 mb-4">
          Scan Cloudinary and remove images that are no longer used by any product.
        </p>

        <div className="flex gap-3">
          <button
            onClick={scanUnused}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
          >
            {loading ? "Scanning..." : "Scan unused images"}
          </button>

          {result?.unusedCount > 0 && (
            <button
              onClick={deleteUnused}
              disabled={loading}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
            >
              Delete unused images
            </button>
          )}
        </div>

        {result && (
          <div className="mt-4 text-sm text-gray-700">
            {result.dryRun && (
              <p>🔍 Found <b>{result.unusedCount}</b> unused images.</p>
            )}
            {result.deletedCount !== undefined && (
              <p>✅ Deleted <b>{result.deletedCount}</b> images.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
