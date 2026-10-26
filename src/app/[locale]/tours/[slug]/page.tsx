import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ArrowRight, BedDouble, Calendar, Car, MapPin, Mountain, UserRound } from "lucide-react";
import { getDetail, getPage, getSiteSettings } from "@/lib/api/server";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/config";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { Badge } from "@/components/ui/misc";
import { SocialIcons } from "@/components/ui/icons";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { TrackView } from "@/components/site/Analytics";
import { FaqList } from "@/components/sections/FaqList";
import { CheckList, DetailSection, MediaStrip } from "@/components/site/DetailBits";
import { SectionTabs } from "@/components/site/SectionTabs";
import { tourImage } from "@/lib/editorial-images";
import type { Tour } from "@/types/cms";
import { reveal3d } from "@/lib/reveal";

// /en/tours/galle-one-day-tour -> Next.js gives us the locale and the slug from the URL
type Props = { params: Promise<{ locale: string; slug: string }> };

/** No paths at build time: each one is rendered on its first visit, then cached and revalidated (ISR). */
export function generateStaticParams() {
  return [];
}

// The big hero picture. A video can't be used here, so fall back to a matching editorial photo.
function heroImageFor(tour: Tour) {
  return tour.heroMedia?.url && tour.heroMedia.resourceType !== "video" ? tour.heroMedia : tourImage(tour);
}

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("tours", slug, locale);
  if (!data) return {};
  const tour = data.item;
  return buildMetadata({
    locale,
    path: `/tours/${tour.slug}`,
    title: tour.title,
    description: tour.shortDescription || tour.description,
    image: heroImageFor(tour),
    seo: tour.seo,
  });
}

// This is a server component (no "use client"): the tour is fetched on the server,
// so Google sees the whole itinerary in the HTML.
export default async function TourDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);

  const [data, listingPage, settings, t, tCommon] = await Promise.all([
    getDetail("tours", slug, locale),
    // The /tours CMS page, only for its title in the breadcrumbs
    getPage("tours", locale),
    getSiteSettings(locale),
    getTranslations("tour"),
    getTranslations("common"),
  ]);
  // Unknown or unpublished slug: notFound() shows the site's 404 page with a real 404 status
  if (!data) notFound();

  const tour = data.item;
  const heroImage = heroImageFor(tour);
  const price = formatPrice(tour.price, tour.currency, locale);
  const bookHref = `/booking?type=tour&tour=${tour._id}`;
  const whatsappMessage = `${settings?.whatsappMessage ?? ""} ${tour.title}`.trim();
  // Unique itinerary stops for the hero card ("Habarana · Kandy · Ella …"), at most 4
  const stops = Array.from(new Set((tour.itinerary ?? []).map((day) => day.location?.trim()).filter((place): place is string => Boolean(place)))).slice(0, 4);
  const repeatedDescriptions = sharedDescriptions(data.related);

  // Tab bar under the hero: only sections that have content
  const tabs = [
    { id: "overview", label: t("overview"), show: true },
    { id: "itinerary", label: t("itinerary"), show: Boolean(tour.itinerary?.length) },
    { id: "included", label: t("included"), show: Boolean(tour.included?.length || tour.excluded?.length) },
    { id: "hotels", label: t("hotels"), show: Boolean(tour.hotels?.length) },
    { id: "faqs", label: t("faqs"), show: Boolean(tour.faqs?.length) },
  ]
    .filter((tab) => tab.show)
    .map(({ id, label }) => ({ id, label }));

  // Structured data for Google (schema.org TouristTrip)
  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.shortDescription,
    url: `${SITE_URL}/${locale}/tours/${tour.slug}`,
    ...(heroImage.url ? { image: heroImage.url } : {}),
    ...(tour.itinerary?.length
      ? { itinerary: { "@type": "ItemList", itemListElement: tour.itinerary.map((day, index) => ({ "@type": "ListItem", position: index + 1, name: day.title })) } }
      : {}),
    ...(tour.price ? { offers: { "@type": "Offer", price: tour.price, priceCurrency: tour.currency ?? "USD", availability: "https://schema.org/InStock" } } : {}),
    ...(settings ? { provider: { "@type": "TravelAgency", name: settings.businessName, telephone: settings.phone } } : {}),
  };

  return (
    <>
      <TrackView event="view_tour" itemId={tour.slug} />
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />

      {/* HERO */}
      <section className="relative isolate flex min-h-[32rem] items-end overflow-hidden bg-forest-900 text-white sm:min-h-[38rem]">
        <CmsImage media={heroImage} alt={heroImage.alt || tour.title} preload wrapperClassName="absolute inset-0 -z-10" className="animate-ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950/80 via-forest-950/25 to-forest-950/40" />
        <div className="container-page w-full pb-12 pt-32 sm:pb-16 sm:pt-40">
          <Breadcrumbs
            locale={locale}
            items={[
              { label: tCommon("home"), href: "/" },
              { label: listingPage?.page.title ?? "", href: "/tours" },
              { label: tour.title },
            ]}
          />

          {/* SUMMARY CARD: title, days, route, price and the main call to action */}
          <div className="mt-4 max-w-xl rounded-2xl border border-white/15 bg-forest-950/55 p-6 shadow-2xl backdrop-blur-md sm:p-8">
            {tour.category?.name && <Badge className="mb-3 bg-gold-500/20 text-gold-200">{tour.category.name}</Badge>}
            <h1 className="font-display text-h1 leading-tight" data-testid="tour-title">
              {tour.title}
            </h1>
            <ul className="mt-4 flex flex-wrap gap-x-4 gap-y-2 text-sm text-white/85">
              {tour.durationDays ? (
                <li className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-gold-400" aria-hidden />
                  {tCommon("days", { count: tour.durationDays })}
                  {tour.durationNights ? ` / ${tCommon("nights", { count: tour.durationNights })}` : ""}
                </li>
              ) : null}
              {stops.map((place) => (
                <li key={place} className="flex items-center gap-1.5">
                  <MapPin className="h-4 w-4 text-gold-400" aria-hidden /> {place}
                </li>
              ))}
              {tour.difficulty && (
                <li className="flex items-center gap-1.5">
                  <Mountain className="h-4 w-4 text-gold-400" aria-hidden /> {t(tour.difficulty)}
                </li>
              )}
            </ul>

            {/* PRICE + BOOK */}
            <div className="mt-6 flex flex-wrap items-center gap-x-6 gap-y-4">
              <p className="text-sm text-white/70">
                {price ? (
                  <>
                    {tCommon("from")} <span className="font-display text-3xl text-gold-400">{price}</span>
                    {tour.priceNote && <span className="block text-xs">{tour.priceNote}</span>}
                  </>
                ) : (
                  <span className="font-display text-xl text-gold-400">{tour.priceNote || tCommon("priceOnRequest")}</span>
                )}
              </p>
              <ButtonLink href={bookHref} className="rounded-md">
                {t("bookThisTour")} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
              </ButtonLink>
            </div>
          </div>
        </div>
      </section>

      {/* TABS */}
      <SectionTabs label={tour.title} tabs={tabs} />

      <div className="container-page grid grid-cols-1 gap-12 py-14 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          {/* OVERVIEW */}
          <DetailSection title={t("overview")} id="overview">
            <Markdown content={tour.description} />
            {tour.highlights?.length ? (
              <div className="mt-8 rounded-3xl bg-forest-50 p-7">
                <h3 className="mb-4 text-h3 text-heading">{t("highlights")}</h3>
                <CheckList items={tour.highlights} />
              </div>
            ) : null}
          </DetailSection>

          {/* ITINERARY: one timeline entry per day */}
          {tour.itinerary?.length ? (
            <DetailSection title={t("itinerary")} id="itinerary">
              <ol className="relative space-y-8 border-s-2 border-dashed border-gold-200 ps-8">
                {tour.itinerary.map((day) => (
                  <li key={day._id ?? day.day} className="relative" {...reveal3d(0)}>
                    <span className="absolute -start-[2.85rem] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-xs font-semibold text-gold-400 ring-4 ring-sand-50">
                      {day.day}
                    </span>
                    <p className="eyebrow">{t("dayLabel", { day: day.day })}</p>
                    <h3 className="mt-1 text-h3 text-heading">{day.title}</h3>
                    {day.image?.url && <CmsImage media={day.image} alt={day.title} sizes="(min-width:1024px) 600px, 100vw" wrapperClassName="mt-4 aspect-[16/9] rounded-2xl shadow-card lg:aspect-[16/7]" depth />}
                    <Markdown content={day.description} className="mt-3 text-[0.95rem]" />
                    {day.activities?.length ? (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {day.activities.map((activity) => (
                          <li key={activity}>
                            <Badge className="bg-sand-100 text-earth-700">{activity}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {day.overnight && (
                      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                        <BedDouble className="h-4 w-4 shrink-0 text-forest-600" aria-hidden /> {t("overnight")}: {day.overnight}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </DetailSection>
          ) : null}

          {/* INCLUDED / EXCLUDED */}
          {tour.included?.length || tour.excluded?.length ? (
            <DetailSection id="included">
              <div className="grid grid-cols-1 gap-10 sm:grid-cols-2">
                {tour.included?.length ? (
                  <div>
                    <h2 className="mb-5 text-2xl text-heading">{t("included")}</h2>
                    <CheckList items={tour.included} />
                  </div>
                ) : null}
                {tour.excluded?.length ? (
                  <div>
                    <h2 className="mb-5 text-2xl text-heading">{t("excluded")}</h2>
                    <CheckList items={tour.excluded} negative />
                  </div>
                ) : null}
              </div>
            </DetailSection>
          ) : null}

          {/* HOTELS */}
          {tour.hotels?.length ? (
            <DetailSection title={t("hotels")} id="hotels">
              <ul className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                {tour.hotels.map((hotel, index) => (
                  <li key={`${hotel.name}-${index}`} className="rounded-2xl border border-sand-200 bg-surface p-5">
                    <p className="font-medium text-heading">
                      {hotel.url ? (
                        <a href={hotel.url} target="_blank" rel="noopener noreferrer" className="hover:underline">
                          {hotel.name}
                        </a>
                      ) : (
                        hotel.name
                      )}
                    </p>
                    <p className="text-sm text-muted">{[hotel.location, hotel.category, hotel.nights ? tCommon("nights", { count: hotel.nights }) : null].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {/* VEHICLE + DRIVER */}
          {(tour.vehicle || tour.driver?.description) && (
            <DetailSection>
              <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
                {tour.vehicle && (
                  <div className="overflow-hidden rounded-3xl border border-sand-200 bg-surface">
                    <CmsImage media={tour.vehicle.images?.[0]} alt={tour.vehicle.name} sizes="400px" wrapperClassName="aspect-[16/9] bg-sand-100" depth />
                    <div className="p-5">
                      <p className="eyebrow mb-1 flex items-center gap-1">
                        <Car className="h-3.5 w-3.5" /> {t("vehicle")}
                      </p>
                      <p className="text-lg text-heading">{tour.vehicle.name}</p>
                      <p className="text-sm text-muted">
                        {[tour.vehicle.seats ? tCommon("seats", { count: tour.vehicle.seats }) : null, tour.vehicle.airConditioning ? tCommon("airConditioned") : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                )}
                {tour.driver?.description && (
                  <div className="rounded-3xl bg-forest-800 p-7 text-white">
                    <p className="eyebrow mb-3 flex items-center gap-1 text-gold-400">
                      <UserRound className="h-4 w-4" /> {t("driver")}
                    </p>
                    {tour.driver.name && <p className="font-display text-2xl">{tour.driver.name}</p>}
                    <p className="mt-2 text-white/80">{tour.driver.description}</p>
                    {tour.driver.languages?.length ? (
                      <p className="mt-4 text-sm text-white/60">
                        {t("languages")}: {tour.driver.languages.join(", ")}
                      </p>
                    ) : null}
                  </div>
                )}
              </div>
            </DetailSection>
          )}

          {/* DESTINATIONS on this tour (44px chips so they are easy to tap) */}
          {tour.destinations?.length ? (
            <DetailSection title={t("destinations")}>
              <ul className="flex flex-wrap gap-2">
                {tour.destinations.map((destination) => (
                  <li key={destination._id}>
                    <CmsLink
                      href={`/destinations/${destination.slug}`}
                      className="inline-flex min-h-11 items-center gap-1.5 rounded-full border border-sand-200 bg-surface px-4 py-2 text-sm hover:border-brand"
                    >
                      <MapPin className="h-3.5 w-3.5 text-gold-600" aria-hidden /> {destination.name}
                    </CmsLink>
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {/* GALLERY */}
          {tour.gallery?.length ? (
            <DetailSection>
              <MediaStrip items={tour.gallery} label={tour.title} />
            </DetailSection>
          ) : null}

          {/* FAQS */}
          {tour.faqs?.length ? (
            <DetailSection title={t("faqs")} id="faqs">
              <FaqList items={tour.faqs} />
            </DetailSection>
          ) : null}
        </div>

        {/* PRICE BOX: sticky next to the content on desktop, below it on phones */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-surface p-7 shadow-card">
            {price ? (
              <>
                <p className="text-sm text-muted">{tCommon("from")}</p>
                <p className="font-display text-4xl text-brand">{price}</p>
                {tour.priceNote && <p className="mt-1 text-sm text-muted">{tour.priceNote}</p>}
              </>
            ) : (
              <p className="font-display text-2xl text-brand">{tour.priceNote || tCommon("priceOnRequest")}</p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-muted">{t("customise")}</p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href={bookHref} size="lg" className="w-full">
                {t("bookThisTour")}
              </ButtonLink>
              {settings?.whatsapp && (
                <a href={whatsappLink(settings.whatsapp, whatsappMessage)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "lg", "w-full")}>
                  <SocialIcons.whatsapp className="h-5 w-5" /> {tCommon("chatOnWhatsapp")}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>

      {/* RELATED TOURS */}
      {data.related.length > 0 && (
        <section className="bg-sand-100 py-section-sm">
          <div className="container-page">
            <h2 className="mb-10 text-h2 text-heading">{t("related")}</h2>
            <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((relatedTour, index) => (
                <div key={relatedTour._id} {...reveal3d(index)}>
                  <TourCard tour={relatedTour} hideDescription={repeatedDescriptions.has(relatedTour.shortDescription?.trim() ?? "")} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
