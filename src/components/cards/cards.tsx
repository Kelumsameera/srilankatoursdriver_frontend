import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Briefcase, Clock, ExternalLink, MapPin, Snowflake, Users } from "lucide-react";
import type { BlogPost, Destination, Excursion, Review, Vehicle } from "@/types/cms";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Badge, Stars } from "@/components/ui/misc";
import { destinationCover, travelImageFor } from "@/lib/editorial-images";

/** `framed`: landscape crop with a fine gold outline (homepage destinations band). */
export function DestinationCard({ destination, tall, framed }: { destination: Destination; tall?: boolean; framed?: boolean }) {
  const subtitle = destination.category?.name || destination.region;
  const cover = destinationCover(destination);
  return (
    <CmsLink
      href={`/destinations/${destination.slug}`}
      className={cn("group relative block overflow-hidden rounded-2xl shadow-card", framed && "ring-1 ring-gold-400/50 ring-offset-0")}
    >
      <CmsImage
        media={cover}
        alt={cover?.alt || destination.name}
        placeholderName={destination.name}
        sizes={framed ? "(min-width: 1024px) 25vw, (min-width: 768px) 33vw, (min-width: 640px) 50vw, 100vw" : "(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"}
        wrapperClassName={framed ? "aspect-[3/2] lg:aspect-[5/4]" : tall ? "aspect-[3/4]" : "aspect-[4/5]"}
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/15 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 flex items-end justify-between gap-3 p-5 text-white">
        <div className="min-w-0">
          <h3 className="font-display text-xl leading-tight break-words hyphens-auto sm:text-2xl lg:text-xl xl:text-2xl">{destination.name}</h3>
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

export function ExcursionCard({ excursion }: { excursion: Excursion }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const price = formatPrice(excursion.price, excursion.currency, locale);
  const cover = excursion.heroMedia?.url && excursion.heroMedia.resourceType !== "video"
    ? excursion.heroMedia
    : travelImageFor(`${excursion.slug} ${excursion.title} ${excursion.location ?? ""}`);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card">
      <CmsImage
        media={cover}
        alt={cover.alt || excursion.title}
        sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
        wrapperClassName="aspect-[16/10]"
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="mb-3 flex flex-wrap gap-2">
          {excursion.category?.name && <Badge>{excursion.category.name}</Badge>}
          {excursion.duration && (
            <Badge className="bg-sand-100 text-earth-700">
              <Clock className="h-3 w-3" aria-hidden /> {excursion.duration}
            </Badge>
          )}
        </div>
        <h3 className="text-xl leading-snug text-forest-900">
          <CmsLink href={`/excursions/${excursion.slug}`} className="after:absolute after:inset-0">
            {excursion.title}
          </CmsLink>
        </h3>
        {excursion.shortDescription && <p className="mt-2 line-clamp-2 text-sm text-muted">{excursion.shortDescription}</p>}
        <div className="mt-auto flex items-center justify-between pt-5 text-sm">
          {excursion.location ? (
            <span className="flex items-center gap-1 text-muted">
              <MapPin className="h-4 w-4 text-gold-600" aria-hidden /> {excursion.location}
            </span>
          ) : (
            <span />
          )}
          <span className="font-semibold text-forest-800">{price ? `${t("from")} ${price}` : excursion.priceNote || ""}</span>
        </div>
      </div>
    </article>
  );
}

/** Vehicle card in the site's card style: photo with type pill, name, spec row, then the daily rate and a round arrow. */
export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const t = useTranslations("common");
  const tv = useTranslations("vehicle");
  const locale = useLocale();
  const rate = formatPrice(vehicle.dailyRate, vehicle.currency, locale);
  const specs = [
    vehicle.seats ? { icon: Users, label: t("seats", { count: vehicle.seats }) } : null,
    vehicle.luggageCapacity ? { icon: Briefcase, label: t("bags", { count: vehicle.luggageCapacity }) } : null,
    vehicle.airConditioning ? { icon: Snowflake, label: t("airConditioned") } : null,
  ].filter(Boolean) as { icon: typeof Users; label: string }[];
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-2xl bg-white shadow-card transition-transform duration-500 hover:-translate-y-1">
      <div className="relative">
        <CmsImage
          media={vehicle.images?.[0]}
          alt={vehicle.images?.[0]?.alt || vehicle.name}
          sizes="(min-width: 1024px) 33vw, (min-width: 768px) 50vw, 100vw"
          wrapperClassName="aspect-[4/3] bg-sand-100"
          className="transition-transform duration-700 group-hover:scale-105"
        />
        {vehicle.type && (
          <span className="absolute start-4 top-4 rounded-full bg-forest-950/80 px-3 py-1 text-[0.7rem] font-bold uppercase tracking-[0.18em] text-white/90 backdrop-blur">
            {vehicle.type}
          </span>
        )}
        {vehicle.availability && vehicle.availability !== "available" && (
          <Badge className="absolute end-4 top-4 bg-gold-100 text-earth-700">{tv(vehicle.availability)}</Badge>
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <div className="flex items-start justify-between gap-3">
          <h3 className="font-display text-xl leading-snug text-forest-900">
            {/* Stretched link: the whole card opens the vehicle overview. */}
            <CmsLink href={`/vehicles/${vehicle.slug}`} className="after:absolute after:inset-0 focus:outline-none">
              {vehicle.name}
            </CmsLink>
          </h3>
          <span
            className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-forest-800 text-white transition-colors group-hover:bg-gold-500 group-hover:text-forest-950"
            aria-hidden
          >
            <ArrowRight className="h-3.5 w-3.5 rtl:rotate-180" />
          </span>
        </div>
        {specs.length > 0 && (
          <ul className="mt-2 flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted">
            {specs.map(({ icon: Icon, label }) => (
              <li key={label} className="flex items-center gap-1.5">
                <Icon className="h-3.5 w-3.5 text-gold-600" aria-hidden /> {label}
              </li>
            ))}
          </ul>
        )}
        <div className="mt-auto border-t border-sand-100 pt-4">
          {rate ? (
            <p className="text-sm text-muted">
              {t("from")} <span className="text-lg font-semibold text-gold-600">{rate}</span> {tv("perDay")}
            </p>
          ) : (
            <p className="text-sm font-medium text-forest-700">{t("priceOnRequest")}</p>
          )}
        </div>
      </div>
    </article>
  );
}

export function BlogCard({ post }: { post: BlogPost }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const cover = post.coverImage?.url && post.coverImage.resourceType !== "video"
    ? post.coverImage
    : travelImageFor(`${post.slug} ${post.title} ${post.category?.name ?? ""}`);
  return (
    <article className="group relative flex h-full flex-col">
      <CmsImage
        media={cover}
        alt={cover.alt || post.title}
        sizes="(min-width: 1024px) 33vw, 100vw"
        wrapperClassName="aspect-[16/10] rounded-3xl"
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="flex flex-1 flex-col pt-5">
        <p className="flex flex-wrap items-center gap-2 text-xs text-muted">
          {post.category?.name && <span className="font-semibold uppercase tracking-wider text-gold-600">{post.category.name}</span>}
          {post.publishDate && <time dateTime={post.publishDate}>{formatDate(post.publishDate, locale)}</time>}
          {post.readingMinutes ? <span>· {t("minRead", { count: post.readingMinutes })}</span> : null}
        </p>
        <h3 className="mt-2 font-display text-xl leading-snug text-forest-900">
          <CmsLink href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </CmsLink>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>}
        <span className="mt-4 inline-flex items-center gap-1.5 text-sm font-semibold text-gold-600 transition-colors group-hover:text-forest-800" aria-hidden>
          {t("readMore")} <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5 rtl:rotate-180 rtl:group-hover:-translate-x-0.5" />
        </span>
      </div>
    </article>
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
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-800 font-display text-lg text-gold-400">
            {review.guestName.charAt(0)}
          </span>
        )}
        <div className="min-w-0 text-sm">
          <p className="font-semibold text-forest-900">{review.guestName}</p>
          <p className="truncate text-xs text-muted">
            {[review.country, review.date ? formatDate(review.date, locale, { month: "short", year: "numeric" }) : null, platform ? t("via", { platform }) : null]
              .filter(Boolean)
              .join(" · ")}
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
