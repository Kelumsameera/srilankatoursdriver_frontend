import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, ExternalLink } from "lucide-react";
import type { Destination, Review } from "@/types/cms";
import { cn, formatDate } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Badge, Stars } from "@/components/ui/misc";
import { destinationCover } from "@/lib/editorial-images";

/** `framed`: landscape crop with a fine gold outline (homepage destinations band). */
export function DestinationCard({ destination, tall, framed }: { destination: Destination; tall?: boolean; framed?: boolean }) {
  const subtitle = destination.category?.name || destination.region;
  const cover = destinationCover(destination);
  return (
    <CmsLink href={`/destinations/${destination.slug}`} className={cn("group relative block overflow-hidden rounded-2xl shadow-card", framed && "ring-1 ring-gold-400/50 ring-offset-0")}>
      <CmsImage
        media={cover}
        alt={cover?.alt || destination.name}
        placeholderName={destination.name}
        sizes={framed ? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
        wrapperClassName={framed ? "aspect-[3/2] lg:aspect-[5/4]" : tall ? "aspect-[3/4]" : "aspect-[4/5]"}
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-linear-to-t from-forest-950/85 via-forest-950/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight wrap-break-word hyphens-auto sm:text-2xl lg:text-xl xl:text-2xl">{destination.name}</h3>
          {subtitle && <p className="mt-1 truncate text-sm text-white/75">{subtitle}</p>}
        </div>
        <span
          className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/70 transition-colors group-hover:border-gold-400 group-hover:bg-gold-400 group-hover:text-forest-950"
          aria-hidden
        >
          <ArrowRight className="h-4 w-4 rtl:rotate-180" />
        </span>
      </div>
    </CmsLink>
  );
}

export function ReviewCard({ review }: { review: Review }) {
  const t = useTranslations("reviews");
  const locale = useLocale();
  const platform = review.platform && review.platform !== "website" ? review.platform : null;
  return (
    <figure className="flex h-full flex-col rounded-3xl bg-white p-7 shadow-card">
      <div className="flex items-center justify-between gap-2">
        <Stars rating={review.rating} />
        {review.verified && <Badge>{t("verified")}</Badge>}
      </div>
      {review.title && <p className="mt-4 font-display text-lg text-forest-900">“{review.title}”</p>}
      <blockquote className="mt-3 line-clamp-6 flex-1 text-sm leading-relaxed text-ink/85">{review.review}</blockquote>
      <figcaption className="mt-6 flex items-center gap-3 border-t border-sand-100 pt-5">
        {review.photo?.url ? (
          <CmsImage media={review.photo} alt={review.guestName} sizes="44px" wrapperClassName="h-11 w-11 shrink-0 rounded-full" />
        ) : (
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-lg text-gold-400">{review.guestName.charAt(0)}</span>
        )}
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-forest-900">{review.guestName}</p>
          <p className="truncate text-xs text-muted">
            {[review.country, review.date ? formatDate(review.date, locale, { month: "short", year: "numeric" }) : null, platform ? t("via", { platform }) : null].filter(Boolean).join(" · ")}
          </p>
        </div>
        {review.sourceUrl && (
          <a
            href={review.sourceUrl}
            target="_blank"
            rel="noopener noreferrer nofollow"
            // 32px target with a real name (the glyph alone is read as "north-east arrow").
            aria-label={`${review.guestName} – ${platform ? t("via", { platform }) : review.sourceUrl}`}
            className="ms-auto inline-flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-forest-600 transition-colors hover:bg-forest-50"
          >
            <ExternalLink className="h-4 w-4" aria-hidden />
          </a>
        )}
      </figcaption>
    </figure>
  );
}
