// lib/adminApi/cloudinaryClientUpload.js
export async function directCloudinaryUpload({
  file,
  folder,
  tags,
  cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UNSIGNED_PRESET,
  timeoutMs = 10 * 60 * 1000, // 10 min
  maxRetries = 2,
  onProgress,
  signal,
}) {
  if (!cloudName || !uploadPreset) {
    throw new Error("Missing Cloudinary environment variables");
  }
  if (!(file instanceof File)) {
    throw new Error("Expected a valid File object");
  }

  // 🧠 Auto-correct MOV file uploads for Cloudinary compatibility
  let uploadFile = file;
  if (file.name.endsWith(".MOV") || file.name.endsWith(".mov")) {
    const renamedFile = new File([file], file.name.replace(/\.MOV$/i, ".mp4"), {
      type: "video/mp4",
    });
    uploadFile = renamedFile;
    console.warn("[Upload] 🎬 Renamed .MOV → .mp4 for Cloudinary compatibility");
  }

  const resourceType = uploadFile.type.startsWith("video") ? "video" : "auto";
  const url = `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/upload`;

  console.log("[Axios] Calling:", url);
  console.log("📦 Upload details:", {
    name: uploadFile.name,
    size: `${(uploadFile.size / (1024 * 1024)).toFixed(2)} MB`,
    type: uploadFile.type,
    folder,
    tags,
  });

  const form = new FormData();
  form.append("file", uploadFile);
  form.append("upload_preset", uploadPreset);
  if (folder) form.append("folder", folder);
  if (tags) form.append("tags", Array.isArray(tags) ? tags.join(",") : tags);

  const doUpload = (attempt = 1) =>
    new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", url, true);
      xhr.timeout = timeoutMs;

      // Optional throttling for smoother progress updates
      let lastPct = 0;
      xhr.upload.onprogress = (evt) => {
        if (evt.lengthComputable && onProgress) {
          const pct = Math.round((evt.loaded / evt.total) * 100);
          if (pct - lastPct >= 1 || pct === 100) {
            lastPct = pct;
            onProgress(pct);
            if (pct % 10 === 0 || pct === 100)
              console.log(`[Upload] Progress ${uploadFile.name}: ${pct}%`);
          }
        }
      };

      xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
          try {
            const json = JSON.parse(xhr.responseText);
            console.log("[Upload] ✅ Cloudinary upload success:", {
              url: json.secure_url,
              public_id: json.public_id,
              resource_type: json.resource_type,
            });
            resolve(json);
          } catch (parseErr) {
            console.error("[Upload] ❌ Invalid JSON response:", parseErr);
            reject(new Error("Invalid JSON response from Cloudinary"));
          }
        } else {
          console.error(`[Upload] ❌ Cloudinary returned status ${xhr.status}`);
          reject(new Error(`Upload failed (${xhr.status})`));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.ontimeout = () => reject(new Error("Upload timeout"));

      // Handle aborts gracefully
      if (signal) {
        signal.addEventListener("abort", () => {
          xhr.abort();
          console.warn("[Upload] ⚠️ Upload aborted by user");
          reject(new Error("Upload aborted"));
        });
      }

      xhr.send(form);
    });

  // Retry loop with exponential backoff
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      const result = await doUpload(attempt);
      return result; // ✅ success
    } catch (err) {
      console.error(`[Upload] Attempt ${attempt} failed:`, err.message);
      if (attempt === maxRetries) throw err;
      const backoff = attempt * 1000;
      console.warn(`[Upload] Retrying in ${backoff}ms…`);
      await new Promise((r) => setTimeout(r, backoff));
    }
  }
}





