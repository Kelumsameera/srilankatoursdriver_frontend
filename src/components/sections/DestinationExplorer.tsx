"use client";

import { useState } from "react";
import { ArrowRight, MapPin } from "lucide-react";
import type { Destination } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { destinationImage } from "@/lib/editorial-images";

const cover = (d: Destination) => (d.heroMedia?.url && d.heroMedia.resourceType !== "video" ? d.heroMedia : destinationImage(d));

/**
 * Desktop destinations explorer (design: list with thumbnails on the left, the selected destination large
 * on the right). Every list item is a real link target too, so nothing depends on JavaScript to be reachable.
 */
export function DestinationExplorer({ destinations, labels }: { destinations: Destination[]; labels: { details: string; list: string } }) {
  const [index, setIndex] = useState(0);
  const current = destinations[index];
  if (!current) return null;
  const subtitle = [current.category?.name, current.region].filter(Boolean).join(" · ");

  return (
    <div className="hidden gap-10 lg:grid lg:grid-cols-[17rem_minmax(0,1fr)]" data-testid="destination-explorer">
      <ul className="max-h-[36rem] space-y-1 overflow-y-auto pe-2" aria-label={labels.list}>
        {destinations.map((d, i) => (
          <li key={d._id}>
            <button
              type="button"
              onClick={() => setIndex(i)}
              aria-pressed={i === index}
              className={cn(
                "flex w-full items-center gap-3 rounded-xl p-2 text-start transition-colors",
                i === index ? "bg-white shadow-card" : "hover:bg-white/70",
              )}
            >
              <CmsImage media={cover(d)} alt="" sizes="64px" wrapperClassName="h-12 w-16 shrink-0 rounded-lg" markIllustrative={false} />
              <span className={cn("min-w-0 flex-1 truncate text-sm font-medium", i === index ? "text-forest-900" : "text-forest-800/80")}>{d.name}</span>
              <ArrowRight className={cn("h-4 w-4 shrink-0 rtl:rotate-180", i === index ? "text-gold-600" : "text-transparent")} aria-hidden />
            </button>
          </li>
        ))}
      </ul>

      <article key={current._id} className="min-w-0 animate-fade-up" aria-live="polite">
        <CmsImage
          media={cover(current)}
          alt={current.heroMedia?.alt || current.name}
          sizes="(min-width: 1280px) 900px, 70vw"
          wrapperClassName="aspect-[16/9] rounded-2xl shadow-card"
        />
        <div className="mt-6 flex flex-wrap items-end justify-between gap-6">
          <div className="max-w-2xl">
            {subtitle && (
              <p className="eyebrow mb-2 flex items-center gap-1.5">
                <MapPin className="h-3.5 w-3.5" aria-hidden /> {subtitle}
              </p>
            )}
            <h2 className="font-display text-4xl text-forest-900">{current.name}</h2>
            {current.shortDescription && <p className="mt-3 leading-relaxed text-muted">{current.shortDescription}</p>}
          </div>
          <CmsLink
            href={`/destinations/${current.slug}`}
            className="inline-flex shrink-0 items-center gap-2 rounded-md bg-forest-800 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-forest-700"
          >
            {labels.details} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </CmsLink>
        </div>
      </article>
    </div>
  );
}
