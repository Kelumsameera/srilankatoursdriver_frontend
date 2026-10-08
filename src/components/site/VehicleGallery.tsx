"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight } from "lucide-react";
import type { MediaAsset } from "@/types/cms";
import { CmsImage } from "@/components/ui/CmsImage";
import { isOptimizable } from "@/lib/cloudinary-loader";
import { cn } from "@/lib/utils";

/** Large photo with previous / next and a thumbnail strip (vehicle detail page). */
export function VehicleGallery({ images, name, labels }: { images: MediaAsset[]; name: string; labels: { previous: string; next: string } }) {
  const photos = images.filter((m) => m.url && m.resourceType !== "video");
  const [index, setIndex] = useState(0);
  if (!photos.length) return <CmsImage media={null} wrapperClassName="aspect-video rounded-2xl" fallbackLabel={name} />;
  const go = (d: number) => setIndex((i) => (i + d + photos.length) % photos.length);
  const current = photos[index];

  return (
    <div
      className="overflow-hidden rounded-2xl border border-white/60 bg-white shadow-card"
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(document.dir === "rtl" ? -1 : 1);
        if (e.key === "ArrowLeft") go(document.dir === "rtl" ? 1 : -1);
      }}
    >
      <div className="relative aspect-video">
        <CmsImage
          key={current.url}
          media={current}
          alt={current.alt || name}
          priority={index === 0}
          sizes="(min-width: 1024px) 66vw, 100vw"
          wrapperClassName="absolute inset-0"
        />
        {photos.length > 1 && (
          <>
            <button
              type="button"
              onClick={() => go(-1)}
              aria-label={labels.previous}
              className="absolute start-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-forest-900 shadow-md transition hover:bg-white"
            >
              <ChevronLeft className="h-5 w-5 rtl:rotate-180" />
            </button>
            <button
              type="button"
              onClick={() => go(1)}
              aria-label={labels.next}
              className="absolute end-3 top-1/2 -translate-y-1/2 rounded-full bg-white/90 p-2.5 text-forest-900 shadow-md transition hover:bg-white"
            >
              <ChevronRight className="h-5 w-5 rtl:rotate-180" />
            </button>
            <span className="absolute bottom-3 end-3 rounded-full bg-forest-950/70 px-3 py-1 text-xs font-medium text-white" aria-live="polite">
              {index + 1} / {photos.length}
            </span>
          </>
        )}
      </div>
      {photos.length > 1 && (
        <ul className="flex gap-2 overflow-x-auto p-3">
          {photos.map((p, i) => (
            <li key={`${p.url}-${i}`} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-label={`${name} ${i + 1}`}
                aria-current={i === index}
                className={cn("relative block h-14 w-20 overflow-hidden rounded-lg ring-2 transition", i === index ? "ring-gold-500" : "opacity-70 ring-transparent hover:opacity-100")}
              >
                <Image src={p.url!} alt="" fill sizes="80px" unoptimized={!isOptimizable(p.url!)} className="object-cover" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
