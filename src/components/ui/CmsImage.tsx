import Image from "next/image";
import { isIllustrative } from "@/lib/editorial-images";
export { isIllustrative } from "@/lib/editorial-images";
import { Mountain } from "lucide-react";
import type { MediaAsset } from "@/types/cms";
import { cn } from "@/lib/utils";
import { isOptimizable } from "@/lib/cloudinary-loader";

interface Props {
  media?: MediaAsset | null;
  alt?: string;
  sizes?: string;
  /** Preload the one image that determines the route's largest contentful paint. */
  preload?: boolean;
  /** Load above-the-fold images immediately without preloading. */
  loading?: "eager" | "lazy";
  className?: string;
  /** Classes for the wrapper (must set a size / aspect ratio). */
  wrapperClassName?: string;
  fallbackLabel?: string;
  /** CSS object-position, e.g. "60% 40%" to keep the subject in frame when cropped. */
  objectPosition?: string;
  /** Set false where the page already labels an AI-generated fallback itself (or the image is a tiny thumbnail). */
  markIllustrative?: boolean;
  /** Shown (in the display font) on the neutral placeholder when there is no image, e.g. the destination name. */
  placeholderName?: string;
  /** The photo drifts inside the frame while scrolling, for a 3D look (see DepthScroll). */
  depth?: boolean;
}

/**
 * Responsive Cloudinary image (via the custom next/image loader) inside a positioned wrapper.
 * When the admin hasn't uploaded an image yet, an on-brand placeholder is shown instead of a broken image.
 */
export function CmsImage({ media, alt, sizes = "100vw", preload, loading, className, wrapperClassName, fallbackLabel, objectPosition, markIllustrative = true, placeholderName, depth }: Props) {
  const url = media?.resourceType === "video" ? undefined : media?.url;
  // `cn` doesn't de-duplicate Tailwind classes: adding "relative" next to a caller's "absolute inset-0"
  // lets "relative" win and the background image collapses to 0×0, so only default the position.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(wrapperClassName ?? "");
  return (
    <div
      className={cn(!positioned && "relative", "overflow-hidden bg-forest-800", wrapperClassName)}
      // Visible "Illustrative image" badge (text from --illustrative-label, see globals.css).
      data-illustrative={markIllustrative && isIllustrative(url, media?.alt) ? "" : undefined}
      data-depth-img={depth && url ? "" : undefined}
    >
      {url ? (
        <Image
          src={url}
          alt={alt ?? media?.alt ?? ""}
          fill
          sizes={sizes}
          preload={preload}
          loading={preload ? undefined : loading}
          // Foreign URLs can't be resized by the Cloudinary loader – serve them as-is instead of a fake srcset.
          unoptimized={!isOptimizable(url)}
          className={cn("object-cover", className)}
          style={objectPosition ? { objectPosition } : undefined}
        />
      ) : (
        <div
          className="absolute inset-0 flex items-center justify-center bg-[radial-gradient(circle_at_30%_20%,#1f7a4d_0%,#0f3d2e_45%,#08261a_100%)]"
          aria-hidden={!fallbackLabel}
          role={fallbackLabel ? "img" : undefined}
          aria-label={fallbackLabel}
        >
          <svg className="absolute inset-0 h-full w-full opacity-[0.07]" aria-hidden>
            <defs>
              <pattern id="leaf" width="40" height="40" patternUnits="userSpaceOnUse" patternTransform="rotate(30)">
                <path d="M20 4c-6 6-9 12-9 17a9 9 0 0 0 18 0c0-5-3-11-9-17z" fill="#fff" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#leaf)" />
          </svg>
          {placeholderName ? (
            <span className="relative flex flex-col items-center gap-3 px-6 text-center">
              <Mountain className="h-8 w-8 text-gold-400/70" strokeWidth={1.2} aria-hidden />
              <span className="font-display text-xl uppercase tracking-[0.18em] text-white/85 break-words">{placeholderName}</span>
            </span>
          ) : (
            <Mountain className="h-10 w-10 text-gold-400/70" strokeWidth={1.2} />
          )}
        </div>
      )}
    </div>
  );
}
