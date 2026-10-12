// "use client" is needed because the arrow buttons scroll the row in the browser (useRef + onClick).
"use client";

import { useRef } from "react";
import { useTranslations } from "next-intl";
import { ArrowLeft, ArrowRight } from "lucide-react";
import type { Destination } from "@/types/cms";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { destinationCover } from "@/lib/editorial-images";

const arrowButtonClass =
  "flex h-11 w-11 items-center justify-center rounded-full border border-gold-500 text-forest-800 transition-colors duration-200 hover:bg-forest-800 hover:text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-800";

// A row of nearby destination cards that scrolls sideways, with previous / next buttons
export function NearbyCarousel({ items }: { items: Destination[] }) {
  const t = useTranslations("destination");
  const rowRef = useRef<HTMLUListElement>(null);

  // Scroll the row by 80% of its width. direction: 1 = next, -1 = previous
  function scrollRow(direction: 1 | -1) {
    const row = rowRef.current;
    if (!row) return;
    // Arabic / Hebrew pages run right-to-left, so "next" scrolls the other way
    const rightToLeft = getComputedStyle(row).direction === "rtl" ? -1 : 1;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    row.scrollBy({ left: direction * rightToLeft * row.clientWidth * 0.8, behavior: reduceMotion ? "auto" : "smooth" });
  }

  return (
    <div>
      {/* PREVIOUS / NEXT BUTTONS */}
      <div className="mb-6 flex justify-end gap-3">
        <button type="button" className={arrowButtonClass} onClick={() => scrollRow(-1)} aria-label={t("previous")}>
          <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </button>
        <button type="button" className={arrowButtonClass} onClick={() => scrollRow(1)} aria-label={t("next")}>
          <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
        </button>
      </div>

      {/* CARDS */}
      <ul
        ref={rowRef}
        tabIndex={0}
        aria-label={t("nearby")}
        className="-mx-1 flex snap-x snap-mandatory gap-5 overflow-x-auto scroll-smooth px-1 pb-4 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800 motion-reduce:scroll-auto"
      >
        {items.map((destination) => {
          const cover = destinationCover(destination);
          return (
            <li key={destination._id} className="w-[78%] shrink-0 snap-start sm:w-[44%] lg:w-[calc((100%-2.5rem)/3)]">
              <CmsLink
                href={`/destinations/${destination.slug}`}
                className="dest-card group block overflow-hidden rounded-lg bg-white shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800"
              >
                {/* IMAGE */}
                <CmsImage
                  media={cover}
                  alt={cover?.alt || destination.name}
                  placeholderName={destination.name}
                  sizes="(max-width: 639px) 78vw, (max-width: 1023px) 44vw, 400px"
                  wrapperClassName="aspect-[4/3]"
                />
                {/* CATEGORY, NAME, DISTANCE */}
                <div className="p-5">
                  {destination.category?.name && <p className="text-xs font-semibold uppercase tracking-[0.18em] text-gold-600">{destination.category.name}</p>}
                  <h3 className="mt-2 font-display text-xl text-ink">{destination.name}</h3>
                  {typeof destination.distanceKm === "number" && destination.distanceKm > 0 && (
                    <p className="mt-1 text-sm text-muted">{t("kmAway", { km: destination.distanceKm })}</p>
                  )}
                </div>
              </CmsLink>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
