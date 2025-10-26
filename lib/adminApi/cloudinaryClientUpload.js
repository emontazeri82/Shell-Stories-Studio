export async function directCloudinaryUpload({
  file,
  folder,
  tags,
  cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET,
  timeoutMs = 10 * 60 * 1000,
  maxRetries = 2,
  onProgress,
  signal,
}) {
  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary env vars");
  }
  if (!(file instanceof File)) {
    throw new Error("Expected a File object");
  }

  const resourceType = file.type.startsWith("video") ? "video" : "auto";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  const form = new FormData();
  form.append("file", file);
  form.append("upload_preset", uploadPreset);
  if (folder) form.append("folder", folder);
  if (tags) form.append("tags", Array.isArray(tags) ? tags.join(",") : tags);

  console.log("[Upload] Starting Cloudinary upload to:", url);

  const xhr = new XMLHttpRequest();
  const promise = new Promise((resolve, reject) => {
    xhr.open("POST", url, true);
    xhr.timeout = timeoutMs;

    xhr.upload.onprogress = (evt) => {
      if (evt.lengthComputable && onProgress) {
        const pct = Math.round((evt.loaded / evt.total) * 100);
        onProgress(pct);
        if (pct % 10 === 0 || pct === 100)
          console.log(`[Upload] Progress: ${pct}%`);
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const json = JSON.parse(xhr.responseText);
        console.log("[Upload] ✅ Cloudinary upload success:", json);
        resolve(json);
      } else {
        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => reject(new Error("Network error"));
    xhr.ontimeout = () => reject(new Error("Upload timeout"));
    xhr.send(form);
  });

  if (signal) {
    signal.addEventListener("abort", () => {
      xhr.abort();
      console.warn("[Upload] Aborted by user");
    });
  }

  return promise;
}





