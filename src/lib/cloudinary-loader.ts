/**
 * next/image loader for Cloudinary URLs: injects width, automatic format and quality
 * so browsers download a correctly sized WebP/AVIF instead of the original upload.
 * Non-Cloudinary URLs are returned unchanged.
 */
export default function cloudinaryLoader({ src, width, quality }: { src: string; width: number; quality?: number }): string {
  return cloudinaryUrl(src, { width, quality });
}

/** True when the loader can resize the URL (Cloudinary upload or a local /public file). */
export function isOptimizable(src: string): boolean {
  return src.startsWith("/") || isCloudinaryUpload(src);
}

function cloudinaryDelivery(src: string, type?: "image" | "video"): URL | null {
  try {
    const url = new URL(src);
    return url.protocol === "https:" && url.hostname === "res.cloudinary.com" && !url.username && !url.password && new RegExp(`^/[^/]+/${type ?? "(?:image|video)"}/upload/`).test(url.pathname) ? url : null;
  } catch { return null; }
}

export const isCloudinaryUpload = (src: string) => !!cloudinaryDelivery(src);
export const isCloudinaryVideo = (src: string) => !!cloudinaryDelivery(src, "video");

export interface CloudinaryOptions {
  width?: number;
  height?: number;
  quality?: number;
  crop?: "fill" | "limit" | "fit" | "thumb";
  gravity?: "auto" | "faces" | "center";
  format?: "auto" | "jpg" | "png" | "webp";
  dpr?: "auto" | number;
}

/** Widths pre-rendered next to each bundled photo in /public/images (name-640.webp, name-1080.webp, name.webp = full size). */
const LOCAL_WIDTHS = [640, 1080];

/** Picks the smallest pre-rendered variant of a bundled /images/*.webp that covers the requested width. */
export function localImageUrl(src: string, width: number): string {
  if (!/^\/images\/[^?#]+\.webp$/.test(src)) return `${src}${src.includes("?") ? "&" : "?"}w=${width}`;
  const w = LOCAL_WIDTHS.find((x) => x >= width);
  return w ? src.replace(/\.webp$/, `-${w}.webp`) : src;
}

export function cloudinaryUrl(src: string, opts: CloudinaryOptions = {}): string {
  // next/image requires the loader to use the width, so local files get a sized variant or a ?w= hint.
  if (src.startsWith("/") && opts.width) return localImageUrl(src, opts.width);
  if (!isCloudinaryUpload(src)) return src;
  // A video poster's original width must not override the responsive width injected by next/image.
  if (opts.width) src = src.replace(/\/upload\/(so_[01]),w_\d+,c_limit,q_auto,f_jpg\//, "/upload/$1/");
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
  const url = cloudinaryDelivery(src, "video");
  if (!url) return "/images/video-placeholder.svg";
  const size = Math.max(320, Math.min(1920, Math.round(width) || 1280));
  url.pathname = url.pathname.replace("/upload/", `/upload/so_1,w_${size},c_limit,q_auto,f_jpg/`).replace(/\.[a-z0-9]+$/i, "") + ".jpg";
  return url.toString();
}

/** Compatibility delivery: explicit H.264 MP4, bounded size, original asset unchanged. */
export function videoUrl(src: string, width = 1920): string {
  const url = cloudinaryDelivery(src, "video");
  if (!url) return src;
  const size = Math.max(320, Math.min(1920, Math.round(width) || 1280));
  url.pathname = url.pathname.replace("/upload/", `/upload/q_auto,vc_h264,f_mp4,w_${size},c_limit/`).replace(/\.[a-z0-9]+$/i, "") + ".mp4";
  return url.toString();
}
