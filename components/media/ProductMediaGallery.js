// components/media/ProductMediaGallery.jsx
"use client";

export default function ProductMediaGallery({ media }) {
  console.log("[Gallery] 🖼 rendering media count:", media?.length);

  if (!media?.length) return null;

  const items = Array.isArray(media) ? media : [];

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
      {items
        .sort((a, b) => (a.sort_order ?? 0) - (b.sort_order ?? 0))
        .map((m) => {
          const url = m.url || m.secure_url;
          const type = (m.resourceType || m.resource_type || m.kind || "").toLowerCase();
          const key = m.publicId || m.public_id || url;

          if (type === "video") {
            const poster = url?.replace(/(\.[^./]+)?$/, ".jpg");
            return (
              <video
                key={key}
                controls
                playsInline
                preload="metadata"
                className="w-full rounded-2xl shadow"
                poster={poster}
              >
                <source src={url} />
              </video>
            );
          }

          // image
          const img = url?.includes("/upload/")
            ? url.replace("/upload/", "/upload/f_auto,q_auto,c_fill,w_900/")
            : url;
          return (
            <img
              key={key}
              src={img}
              alt={m.alt || ""}
              className="w-full rounded-2xl shadow object-cover"
              loading="lazy"
            />
          );
        })}
    </div>
  );
}
