import { useLocale, useTranslations } from "next-intl";
import { ArrowRight, Briefcase, Calendar, Clock, MapPin, Snowflake, Users } from "lucide-react";
import type { BlogPost, Destination, Excursion, Review, Tour, Vehicle } from "@/types/cms";
import { formatDate, formatPrice } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Badge, Stars } from "@/components/ui/misc";

export function TourCard({ tour }: { tour: Tour }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const price = formatPrice(tour.price, tour.currency, locale);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card transition-transform duration-500 hover:-translate-y-1">
      <CmsLink href={`/tours/${tour.slug}`} className="relative z-10 block" ariaLabel={tour.title}>
        <CmsImage
          media={tour.heroMedia}
          alt={tour.heroMedia?.alt || tour.title}
          sizes="(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw"
          wrapperClassName="aspect-[4/3]"
          className="transition-transform duration-700 group-hover:scale-105"
        />
        {tour.durationDays ? (
          <span className="absolute start-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-white/95 px-3 py-1.5 text-xs font-semibold text-forest-900 shadow">
            <Calendar className="h-3.5 w-3.5 text-gold-600" aria-hidden />
            {t("days", { count: tour.durationDays })}
            {tour.durationNights ? ` / ${t("nights", { count: tour.durationNights })}` : ""}
          </span>
        ) : null}
      </CmsLink>
      <div className="flex flex-1 flex-col p-6">
        {tour.category?.name && <p className="eyebrow mb-2 text-[0.68rem]">{tour.category.name}</p>}
        <h3 className="text-xl leading-snug text-forest-900">
          <CmsLink href={`/tours/${tour.slug}`} className="after:absolute after:inset-0 focus:outline-none">
            <span className="relative">{tour.title}</span>
          </CmsLink>
        </h3>
        {tour.shortDescription && <p className="mt-3 line-clamp-3 text-sm leading-relaxed text-muted">{tour.shortDescription}</p>}
        <div className="mt-auto flex items-end justify-between gap-3 pt-6">
          <div>
            {price ? (
              <>
                <p className="text-xs text-muted">{t("from")}</p>
                <p className="text-xl font-semibold text-forest-800">{price}</p>
              </>
            ) : (
              <p className="text-sm font-medium text-forest-700">{tour.priceNote || t("priceOnRequest")}</p>
            )}
          </div>
          <CmsLink
            href={`/tours/${tour.slug}`}
            className="relative z-10 inline-flex items-center gap-1 text-sm font-medium text-forest-700 transition-colors hover:text-gold-600"
          >
            {t("viewDetails")}
            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1 rtl:rotate-180" aria-hidden />
          </CmsLink>
        </div>
      </div>
    </article>
  );
}

export function DestinationCard({ destination, tall }: { destination: Destination; tall?: boolean }) {
  return (
    <CmsLink href={`/destinations/${destination.slug}`} className="group relative block overflow-hidden rounded-3xl shadow-card">
      <CmsImage
        media={destination.heroMedia}
        alt={destination.heroMedia?.alt || destination.name}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        wrapperClassName={tall ? "aspect-[3/4]" : "aspect-[4/5]"}
        className="transition-transform duration-700 group-hover:scale-105"
      />
      <div className="absolute inset-0 bg-gradient-to-t from-forest-950/85 via-forest-950/20 to-transparent" />
      <div className="absolute inset-x-0 bottom-0 p-6 text-white">
        {destination.region && (
          <p className="mb-1 flex items-center gap-1 text-xs uppercase tracking-widest text-gold-400">
            <MapPin className="h-3 w-3" aria-hidden /> {destination.region}
          </p>
        )}
        <h3 className="text-2xl">{destination.name}</h3>
        {destination.shortDescription && (
          <p className="mt-2 line-clamp-2 max-h-0 text-sm text-white/80 opacity-0 transition-all duration-500 group-hover:max-h-16 group-hover:opacity-100 group-focus-visible:max-h-16 group-focus-visible:opacity-100">
            {destination.shortDescription}
          </p>
        )}
      </div>
    </CmsLink>
  );
}

export function ExcursionCard({ excursion }: { excursion: Excursion }) {
  const t = useTranslations("common");
  const locale = useLocale();
  const price = formatPrice(excursion.price, excursion.currency, locale);
  return (
    <article className="group relative flex h-full flex-col overflow-hidden rounded-3xl bg-white shadow-card">
      <CmsImage
        media={excursion.heroMedia}
        alt={excursion.heroMedia?.alt || excursion.title}
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

export function VehicleCard({ vehicle }: { vehicle: Vehicle }) {
  const t = useTranslations("common");
  const tv = useTranslations("vehicle");
  const locale = useLocale();
  const rate = formatPrice(vehicle.dailyRate, vehicle.currency, locale);
  return (
    <article className="flex h-full flex-col overflow-hidden rounded-3xl border border-sand-200 bg-white">
      <CmsImage
        media={vehicle.images?.[0]}
        alt={vehicle.images?.[0]?.alt || vehicle.name}
        sizes="(min-width: 1024px) 33vw, 100vw"
        wrapperClassName="aspect-[16/10] bg-sand-100"
      />
      <div className="flex flex-1 flex-col p-6">
        <div className="flex items-start justify-between gap-3">
          <div>
            {vehicle.type && <p className="eyebrow mb-1 text-[0.68rem]">{vehicle.type}</p>}
            <h3 className="text-xl text-forest-900">{vehicle.name}</h3>
          </div>
          {vehicle.availability && vehicle.availability !== "available" && (
            <Badge className="bg-gold-100 text-earth-700">{tv(vehicle.availability)}</Badge>
          )}
        </div>
        <ul className="mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted">
          {vehicle.seats ? (
            <li className="flex items-center gap-1.5">
              <Users className="h-4 w-4 text-forest-600" aria-hidden /> {t("seats", { count: vehicle.seats })}
            </li>
          ) : null}
          {vehicle.luggageCapacity ? (
            <li className="flex items-center gap-1.5">
              <Briefcase className="h-4 w-4 text-forest-600" aria-hidden /> {t("bags", { count: vehicle.luggageCapacity })}
            </li>
          ) : null}
          {vehicle.airConditioning && (
            <li className="flex items-center gap-1.5">
              <Snowflake className="h-4 w-4 text-forest-600" aria-hidden /> {t("airConditioned")}
            </li>
          )}
        </ul>
        {vehicle.description && <p className="mt-4 line-clamp-3 text-sm leading-relaxed text-muted">{vehicle.description}</p>}
        <div className="mt-auto flex items-center justify-between pt-6">
          {rate ? (
            <p className="text-sm text-muted">
              <span className="text-lg font-semibold text-forest-800">{rate}</span> {tv("perDay")}
            </p>
          ) : (
            <span className="text-sm text-forest-700">{t("priceOnRequest")}</span>
          )}
          <CmsLink href={`/booking?type=vehicle&vehicle=${vehicle._id}`} className="text-sm font-medium text-forest-700 hover:text-gold-600">
            {t("bookNow")} →
          </CmsLink>
        </div>
      </div>
    </article>
  );
}

export function BlogCard({ post }: { post: BlogPost }) {
  const t = useTranslations("common");
  const locale = useLocale();
  return (
    <article className="group relative flex h-full flex-col">
      <CmsImage
        media={post.coverImage}
        alt={post.coverImage?.alt || post.title}
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
        <h3 className="mt-2 text-xl leading-snug text-forest-900">
          <CmsLink href={`/blog/${post.slug}`} className="after:absolute after:inset-0">
            {post.title}
          </CmsLink>
        </h3>
        {post.excerpt && <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-muted">{post.excerpt}</p>}
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
          <a href={review.sourceUrl} target="_blank" rel="noopener noreferrer nofollow" className="ms-auto text-xs text-forest-600 underline">
            ↗
          </a>
        )}
      </figcaption>
    </figure>
  );
}
