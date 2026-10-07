/**
 * next/image loader for Cloudinary URLs: injects width, automatic format and quality
 * so browsers download a correctly sized WebP/AVIF instead of the original upload.
 * Non-Cloudinary URLs are returned unchanged.
 */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  return cloudinaryUrl(src, { width, quality });
}

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: number;
  crop?: "fill" | "limit" | "fit" | "thumb";
  gravity?: "auto" | "faces" | "center";
  format?: "auto" | "jpg" | "png" | "webp";
  dpr?: "auto" | number;
}

export function cloudinaryUrl(src: string, opts: CloudinaryOptions = {}): string {
  if (!src || !src.includes("res.cloudinary.com") || !src.includes("/upload/")) {
    // next/image requires the loader to use the width; harmless for local/static files.
    return src.startsWith("/") && opts.width ? `${src}${src.includes("?") ? "&" : "?"}w=${opts.width}` : src;
  }
  const parts = [
    `f_${opts.format ?? "auto"}`,
    `q_${opts.quality ?? "auto"}`,
    opts.width ? `w_${Math.round(opts.width)}` : "",
    opts.height ? `h_${Math.round(opts.height)}` : "",
    opts.crop ? `c_${opts.crop}` : opts.height ? "c_fill" : "c_limit",
    opts.crop === "fill" || (opts.height && !opts.crop) ? `g_${opts.gravity ?? "auto"}` : "",
    opts.dpr ? `dpr_${opts.dpr}` : "",
  ].filter(Boolean);
  return src.replace("/upload/", `/upload/${parts.join(",")}/`);
}

/** Poster frame (JPG) for a Cloudinary video. */
export function videoPoster(src: string, width = 1280): string {
  if (!src.includes("/video/upload/")) return src;
  return src.replace("/upload/", `/upload/so_1,w_${width},c_limit,q_auto,f_jpg/`).replace(/\.(mp4|webm|mov)$/i, ".jpg");
}

/** Optimised video delivery (auto codec/quality, size-capped). */
export function videoUrl(src: string, width = 1920): string {
  if (!src.includes("/video/upload/")) return src;
  return src.replace("/upload/", `/upload/q_auto,vc_auto,w_${width},c_limit/`);
}
