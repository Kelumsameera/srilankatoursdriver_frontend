import Image from "next/image";
import { Mountain } from "lucide-react";
import type { MediaAsset } from "@/types/cms";
import { cn } from "@/lib/utils";
import { isOptimizable } from "@/lib/cloudinary-loader";

interface Props {
  media?: MediaAsset | null;
  alt?: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
  /** Classes for the wrapper (must set a size / aspect ratio). */
  wrapperClassName?: string;
  fallbackLabel?: string;
}

/**
 * Responsive Cloudinary image (via the custom next/image loader) inside a positioned wrapper.
 * When the admin hasn't uploaded an image yet, an on-brand placeholder is shown instead of a broken image.
 */
export function CmsImage({ media, alt, sizes = "100vw", priority, className, wrapperClassName, fallbackLabel }: Props) {
  const url = media?.resourceType === "video" ? undefined : media?.url;
  // `cn` doesn't de-duplicate Tailwind classes: adding "relative" next to a caller's "absolute inset-0"
  // lets "relative" win and the background image collapses to 0×0, so only default the position.
  const positioned = /(^|\s)(absolute|fixed|sticky)(\s|$)/.test(wrapperClassName ?? "");
  return (
    <div className={cn(!positioned && "relative", "overflow-hidden bg-forest-800", wrapperClassName)}>
      {url ? (
        <Image
          src={url}
          alt={alt ?? media?.alt ?? ""}
          fill
          sizes={sizes}
          priority={priority}
          // Foreign URLs can't be resized by the Cloudinary loader – serve them as-is instead of a fake srcset.
          unoptimized={!isOptimizable(url)}
          className={cn("object-cover", className)}
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
          <Mountain className="h-10 w-10 text-gold-400/70" strokeWidth={1.2} />
        </div>
      )}
    </div>
  );
}
