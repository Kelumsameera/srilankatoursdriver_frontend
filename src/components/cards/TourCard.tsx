import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { Tour } from "@/types/cms";
import { formatPrice } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { tourImage } from "@/lib/editorial-images";

// Descriptions used by more than one tour in a list (e.g. a generic import placeholder). Cards with such a
// description show only their real route instead, so neighbouring cards never repeat the same text.
export function sharedDescriptions(tours: Tour[]): Set<string> {
  const countByDescription = new Map<string, number>();
  for (const tour of tours) {
    const description = tour.shortDescription?.trim();
    if (description) countByDescription.set(description, (countByDescription.get(description) ?? 0) + 1);
  }
  return new Set([...countByDescription].filter(([, count]) => count > 1).map(([description]) => description));
}

// Unique itinerary stops in order ("Negombo, Ella, Kandy …"), from the tour's real itinerary
function routeStops(tour: Tour): string[] {
  const stops: string[] = [];
  for (const day of tour.itinerary ?? []) {
    const place = day.location?.trim();
    if (place && !stops.includes(place)) stops.push(place);
  }
  return stops;
}

// Tour card: photo, title (the whole card is a link), days + route, then the price and a round arrow
export function TourCard({ tour, hideDescription }: { tour: Tour; hideDescription?: boolean }) {
  const tCommon = useTranslations("common");
  const tTour = useTranslations("tour");
  const locale = useLocale();
  const price = formatPrice(tour.price, tour.currency, locale);
  const stops = routeStops(tour);
  const meta = [tour.durationDays ? tCommon("days", { count: tour.durationDays }) : null, stops.join(", ") || null].filter(Boolean).join(" · ");
  // A video can't be a card picture, so fall back to a matching editorial photo
  const cover = tour.heroMedia?.url && tour.heroMedia.resourceType !== "video" ? tour.heroMedia : tourImage(tour);

  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-transform duration-500 hover:-translate-y-1">
      {/* IMAGE */}
      <CmsImage
        media={cover}
        alt={cover.alt || tour.title}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        wrapperClassName="aspect-[4/3]"
        className="transition-transform duration-700 group-hover:scale-105"
      />

      <div className="flex flex-1 flex-col p-5">
        {/* TITLE */}
        <h3 className="font-display text-xl leading-snug text-forest-900">
          {/* Stretched link: the whole card opens the tour. */}
          <CmsLink href={`/tours/${tour.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {tour.title}
          </CmsLink>
        </h3>

        {/* DAYS + ROUTE */}
        {meta && (
          <p className="mt-1.5 line-clamp-2 text-xs leading-relaxed text-muted">
            {stops.length > 0 && <span className="sr-only">{tTour("route")}: </span>}
            {meta}
          </p>
        )}

        {/* DESCRIPTION: without route data the description is the only way to tell tours apart */}
        {!stops.length && !hideDescription && tour.shortDescription && <p className="mt-2 line-clamp-2 text-sm leading-relaxed text-muted">{tour.shortDescription}</p>}

        {/* PRICE */}
        <div className="mt-auto flex items-end justify-between gap-3 border-t border-sand-100 pt-4">
          <div>
            {price ? (
              <p className="text-sm text-muted">
                {tCommon("from")} <span className="text-lg font-semibold text-gold-600">{price}</span>
                {tour.priceNote && <span className="block text-xs">{tour.priceNote}</span>}
              </p>
            ) : (
              <p className="text-sm font-medium text-forest-700">{tour.priceNote || tCommon("priceOnRequest")}</p>
            )}
          </div>
          <span
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-gold-500/60 text-gold-600 transition-colors group-hover:bg-gold-500 group-hover:text-forest-950"
            aria-hidden
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </article>
  );
}
