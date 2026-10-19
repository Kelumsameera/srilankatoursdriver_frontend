import { useLocale, useTranslations } from "next-intl";
import { ArrowRight } from "lucide-react";
import type { Tour } from "@/types/cms";
import { formatPrice } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { tourImage } from "@/lib/editorial-images";

// Tall photo card for the "staggered" tour layout: the whole card is the photo, with title, days and price on it
export function TallTourCard({ tour, className }: { tour: Tour; className?: string }) {
  const tCommon = useTranslations("common");
  const locale = useLocale();
  const price = formatPrice(tour.price, tour.currency, locale);
  // A video can't be a card picture, so fall back to a matching editorial photo
  const cover = tour.heroMedia?.url && tour.heroMedia.resourceType !== "video" ? tour.heroMedia : tourImage(tour);

  return (
    <article data-depth-card className="tall-tour-card group relative h-full overflow-hidden rounded-[2rem] shadow-card transition-transform duration-500 hover:-translate-y-1">
      {/* PHOTO (fills the card; the wrapper sets the card's height) */}
      <CmsImage
        media={cover}
        alt={cover.alt || tour.title}
        sizes="(min-width: 1024px) 30vw, (min-width: 640px) 50vw, 100vw"
        wrapperClassName={className}
        depth
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="pointer-events-none absolute inset-0 bg-linear-to-t from-forest-950/90 via-forest-950/20 to-transparent" />

      {/* TEXT ON THE PHOTO: days, title, price + round arrow */}
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        {tour.durationDays ? <p className="eyebrow text-gold-400">{tCommon("days", { count: tour.durationDays })}</p> : null}
        <h3 className="mt-2 font-display text-2xl leading-tight [text-shadow:0_1px_8px_rgb(4_23_15/0.6)]">
          {/* Stretched link: the whole card opens the tour. */}
          <CmsLink href={`/tours/${tour.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            {tour.title}
          </CmsLink>
        </h3>
        <div className="mt-4 flex items-center justify-between gap-3 border-t border-white/20 pt-4">
          <p className="text-sm text-white/80">
            {price ? (
              <>
                {tCommon("from")} <span className="text-lg font-semibold text-gold-400">{price}</span>
              </>
            ) : (
              tour.priceNote || tCommon("priceOnRequest")
            )}
          </p>
          <span
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 transition-colors group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950"
            aria-hidden
          >
            <ArrowRight className="h-4 w-4 rtl:rotate-180" />
          </span>
        </div>
      </div>
    </article>
  );
}
