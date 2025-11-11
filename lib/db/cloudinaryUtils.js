// 🔹 Safe Cloudinary utilities shared across components
export function toSafeCloudinaryUrl(url) {
    if (!url) return "";
    return url.replace(/\.mov$/i, ".mp4");
  }
  
  export function makePosterFromVideo(url) {
    if (!url) return "/placeholder.png";
    const safe = toSafeCloudinaryUrl(url);
    return safe.replace("/upload/", "/upload/so_1,f_jpg,q_auto:eco/");
  }
  
  export function buildCloudinaryTransform(url, opts = {}) {
    if (!url) return "";
    const safe = toSafeCloudinaryUrl(url);
    const params = [
      "f_auto",
      opts.video ? "vc_auto" : "",
      `q_auto:${opts.quality || "good"}`,
      `w_${opts.width || 1280}`,
      `h_${opts.height || 720}`,
    ].filter(Boolean);
    return safe.replace("/upload/", `/upload/${params.join(",")}/`);
  }
  