"use client";

import { useCallback, useEffect, useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Play, X } from "lucide-react";
import type { GalleryItem } from "@/types/cms";
import { cn } from "@/lib/utils";
import { videoPoster, videoUrl } from "@/lib/cloudinary-loader";

interface Props {
  items: GalleryItem[];
  labels: { close: string; previous: string; next: string; all: string; photos: string; videos: string };
  filters?: boolean;
  variant?: "masonry" | "strip";
}

/** Responsive gallery with an accessible lightbox (keyboard: ←, →, Esc). */
export function GalleryGrid({ items, labels, filters, variant = "masonry" }: Props) {
  const [type, setType] = useState<"all" | "image" | "video">("all");
  const [open, setOpen] = useState<number | null>(null);
  const shown = items.filter((i) => type === "all" || (i.media.resourceType ?? "image") === type);

  const close = useCallback(() => setOpen(null), []);
  const step = useCallback((d: number) => setOpen((o) => (o === null ? o : (o + d + shown.length) % shown.length)), [shown.length]);

  useEffect(() => {
    if (open === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") close();
      if (e.key === "ArrowRight") step(document.dir === "rtl" ? -1 : 1);
      if (e.key === "ArrowLeft") step(document.dir === "rtl" ? 1 : -1);
    };
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, close, step]);

  const current = open !== null ? shown[open] : null;
  const hasVideos = items.some((i) => i.media.resourceType === "video");

  return (
    <div>
      {filters && hasVideos && (
        <div className="mb-8 flex justify-center gap-2" role="tablist">
          {(["all", "image", "video"] as const).map((k) => (
            <button
              key={k}
              role="tab"
              aria-selected={type === k}
              type="button"
              onClick={() => setType(k)}
              className={cn("rounded-full px-5 py-2 text-sm font-medium", type === k ? "bg-forest-800 text-white" : "bg-white text-forest-800 hover:bg-sand-100")}
            >
              {k === "all" ? labels.all : k === "image" ? labels.photos : labels.videos}
            </button>
          ))}
        </div>
      )}
      <ul className={cn(variant === "masonry" ? "columns-2 gap-3 sm:gap-4 md:columns-3 lg:columns-4" : "grid grid-cols-2 gap-3 sm:gap-4 md:grid-cols-4")} data-testid="gallery-grid">
        {shown.map((item, i) => {
          const isVideo = item.media.resourceType === "video";
          const src = isVideo ? videoPoster(item.media.url ?? "") : item.media.url;
          const ratio = item.media.width && item.media.height ? item.media.width / item.media.height : 4 / 3;
          return (
            <li key={item._id} className={cn("break-inside-avoid", variant === "masonry" && "mb-3 sm:mb-4")}>
              <button
                type="button"
                onClick={() => setOpen(i)}
                className="group relative block w-full overflow-hidden rounded-2xl bg-forest-800"
                style={variant === "masonry" ? { aspectRatio: String(ratio) } : { aspectRatio: "1" }}
                aria-label={item.title || item.altText || item.caption || "Open"}
              >
                {src && (
                  <Image
                    src={src}
                    alt={item.altText || item.media.alt || item.title || ""}
                    fill
                    sizes="(min-width: 1024px) 25vw, (min-width: 768px) 33vw, 50vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                )}
                <span className="absolute inset-0 bg-forest-950/0 transition-colors group-hover:bg-forest-950/25" />
                {isVideo && (
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="rounded-full bg-white/90 p-3 text-forest-900 shadow-lg">
                      <Play className="h-5 w-5 fill-current" />
                    </span>
                  </span>
                )}
                {item.title && (
                  <span className="absolute inset-x-0 bottom-0 translate-y-full bg-gradient-to-t from-forest-950/80 p-3 text-start text-sm text-white transition-transform group-hover:translate-y-0">
                    {item.title}
                  </span>
                )}
              </button>
            </li>
          );
        })}
      </ul>

      {current && (
        <div role="dialog" aria-modal="true" aria-label={current.title || "Gallery"} className="fixed inset-0 z-50 flex items-center justify-center bg-forest-950/95 p-4" onClick={close}>
          <button type="button" onClick={close} className="absolute end-4 top-4 rounded-full p-2 text-white hover:bg-white/10" aria-label={labels.close}>
            <X className="h-7 w-7" />
          </button>
          {shown.length > 1 && (
            <>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(-1);
                }}
                className="absolute start-2 rounded-full p-3 text-white hover:bg-white/10 sm:start-6"
                aria-label={labels.previous}
              >
                <ChevronLeft className="h-8 w-8 rtl:rotate-180" />
              </button>
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  step(1);
                }}
                className="absolute end-2 rounded-full p-3 text-white hover:bg-white/10 sm:end-6"
                aria-label={labels.next}
              >
                <ChevronRight className="h-8 w-8 rtl:rotate-180" />
              </button>
            </>
          )}
          <figure className="flex max-h-full max-w-5xl flex-col items-center" onClick={(e) => e.stopPropagation()}>
            {current.media.resourceType === "video" ? (
              <video src={videoUrl(current.media.url ?? "")} controls autoPlay playsInline className="max-h-[80vh] w-auto rounded-xl" />
            ) : (
              <div className="relative h-[80vh] w-[90vw] max-w-5xl">
                <Image src={current.media.url ?? ""} alt={current.altText || current.title || ""} fill sizes="90vw" className="object-contain" />
              </div>
            )}
            {(current.title || current.caption) && (
              <figcaption className="mt-4 text-center text-sm text-white/80">
                {current.title && <span className="font-medium text-white">{current.title}</span>}
                {current.caption && <span className="block">{current.caption}</span>}
              </figcaption>
            )}
          </figure>
        </div>
      )}
    </div>
  );
}
