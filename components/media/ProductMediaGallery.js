"use client";

export default function ProductMediaGallery({ media, onDeleteMedia }) {
  console.log("[Gallery] 🖼 Rendering ProductMediaGallery with count:", media?.length ?? 0);

  // ────────────────────────────────
  // 🧠 Validate media input
  // ────────────────────────────────
  if (!Array.isArray(media) || media.length === 0) {
    console.warn("[Gallery] ⚠️ No media to display");
    return (
      <div className="text-sm text-gray-500 italic">
        No media available.
      </div>
    );
  }

  const items = media.filter((m) => !!(m.url || m.secure_url));

  return (
    <div 
      className="grid gap-3"
      style={{
        gridTemplateColumns: "repeat(auto-fill, minmax(110px, 1fr))",
      }}
    >
      {items
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((m, index) => {
          const url = m.url || m.secure_url;
          const type = (m.resourceType || m.resource_type || m.kind || "").toLowerCase();
          const key = m.publicId || m.public_id || `${url}-${index}`;

          if (!url) {
            console.warn("[Gallery] ⚠️ Skipping media without URL:", m);
            return null;
          }

          // ────────────────────────────────
          // 🎥 VIDEO Rendering
          // ────────────────────────────────
          if (type === "video") {
            const poster = url?.replace(/(\.[^./]+)?$/, ".jpg");
            console.log("[Gallery] 🎬 Rendering video:", url);

            return (
              <div key={key} className="relative group">
                <video
                  controls
                  playsInline
                  preload="metadata"
                  className="w-full rounded-2xl shadow transition-opacity duration-200"
                  poster={poster}
                >
                  <source src={url} />
                  Your browser does not support the video tag.
                </video>

                {/* ❌ Delete button overlay */}
                <button
                  onClick={() => onDeleteMedia?.(m)}
                  className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full w-7 h-7 
                             flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                  title="Delete video"
                >
                  ×
                </button>
              </div>
            );
          }

          // ────────────────────────────────
          // 🖼 IMAGE Rendering
          // ────────────────────────────────
          const transformedUrl = url.includes("/upload/")
            ? url.replace("/upload/", "/upload/f_auto,q_auto,c_fill,w_900/")
            : url;

          console.log("[Gallery] 🖼 Rendering image:", transformedUrl);

          return (
            <div key={key} className="relative group">
              <img
                src={transformedUrl}
                alt={m.alt || "Product image"}
                className="w-full rounded-2xl shadow object-cover transition-opacity duration-200"
                loading="lazy"
                onError={(e) => {
                  console.error("[Gallery] ❌ Image failed to load:", transformedUrl);
                  e.target.style.opacity = 0.4;
                  e.target.alt = "Image failed to load";
                }}
              />

              {/* ❌ Delete button overlay */}
              <button
                type="button"
                onClick={() => onDeleteMedia?.(m)}
                className="absolute top-2 right-2 bg-black/60 hover:bg-red-600 text-white rounded-full w-7 h-7 
                           flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-200"
                title="Delete image"
              >
                ×
              </button>
            </div>
          );
        })}
    </div>
  );
}


