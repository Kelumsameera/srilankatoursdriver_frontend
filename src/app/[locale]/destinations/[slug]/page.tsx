import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, Car, Route } from "lucide-react";
import { getDetail, getList, getNearbyDestinations, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/config";
import { CmsImage, isIllustrative } from "@/components/ui/CmsImage";
import { ButtonLink } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CheckList, DetailSection, MediaStrip } from "@/components/site/DetailBits";
import { destinationCover } from "@/lib/editorial-images";
import { DestinationMap } from "@/components/site/DestinationMap";
import { FeaturedExperiences } from "@/components/site/FeaturedExperiences";
import { DotEyebrow } from "@/components/destinations/Eyebrow";
import { NearbyCarousel } from "@/components/destinations/NearbyCarousel";
import { validCoordinates } from "@/lib/destination-map";
import { stripMarkdown } from "@/lib/utils";
import { reveal3d } from "@/lib/reveal";
import type { Destination, MediaAsset } from "@/types/cms";

// /en/destinations/kandy -> Next.js gives us { locale: "en", slug: "kandy" }
type Props = { params: Promise<{ locale: string; slug: string }> };

// CMS page content is read per request; destination API responses keep their tagged cache.
// generateMetadata sets the <title>, description and share image for this destination
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  await connection();
  const { locale, slug } = await params;
  const data = await getDetail("destinations", slug, locale);
  if (!data) return {};
  const destination = data.item;
  return buildMetadata({
    locale,
    path: `/destinations/${destination.slug}`,
    title: destination.name,
    description: destination.shortDescription || destination.description,
    image: destinationCover(destination) ?? undefined,
    seo: destination.seo,
  });
}

// Structured data for Google (schema.org "TouristDestination"), added to the page as JSON-LD
function buildSchema(destination: Destination, locale: string, cover: MediaAsset | null | undefined) {
  return {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: destination.name,
    description: stripMarkdown(destination.shortDescription || destination.description || "", 300),
    url: `${SITE_URL}/${locale}/destinations/${destination.slug}`,
    // AI / illustrative images are never sent to Google as a real photo
    ...(cover?.url && !isIllustrative(cover.url, cover.alt) ? { image: cover.url } : {}),
    ...(validCoordinates(destination.location) ? { geo: { "@type": "GeoCoordinates", latitude: destination.location?.lat, longitude: destination.location?.lng } } : {}),
    ...(destination.featuredExperiences?.length
      ? {
          includesAttraction: destination.featuredExperiences.filter((experience) => experience.title).map((experience) => ({ "@type": "TouristAttraction", name: experience.title })),
        }
      : {}),
    containedInPlace: { "@type": "Country", name: "Sri Lanka" },
  };
}

// Server component: everything below runs on the server and the visitor gets ready-made HTML
export default async function DestinationDetailPage({ params }: Props) {
  await connection();
  const { locale, slug } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);

  const [data, listingPage, settings, nearbyDestinations, t, tCommon] = await Promise.all([
    getDetail("destinations", slug, locale),
    getPage("destinations", locale),
    getSiteSettings(locale),
    getNearbyDestinations(slug, locale),
    getTranslations("destination"),
    getTranslations("common"),
  ]);
  // notFound() shows the Next.js 404 page
  if (!data) notFound();

  const destination = data.item;
  const cover = destinationCover(destination);
  const tours = await getList("tours", { locale, destination: destination._id, limit: 3 });

  const intro = destination.shortDescription || stripMarkdown(destination.description || "", 400) || t("descriptionFallback", { name: destination.name });
  // The longer story text is only shown when it says more than the intro
  const story = destination.description && stripMarkdown(destination.description, 400) !== intro ? destination.description : "";
  const eyebrow = destination.tagline || destination.category?.name || destination.region;
  const whatsapp = settings?.whatsapp ? { phone: settings.whatsapp, message: t("whatsappMessage", { name: destination.name }) } : null;
  // Nearby destinations, or the same-category ones from the detail API when nearby is empty
  const relatedDestinations = nearbyDestinations?.length ? nearbyDestinations : data.related;
  const hasTours = Boolean(tours?.items.length);

  // The two "practical information" cards that have the same layout
  const infoCards = [
    { key: "best", icon: CalendarDays, title: t("bestTime"), body: destination.bestTimeToVisit, fallback: t("bestTimeFallback") },
    { key: "travel", icon: Car, title: t("howToGetThere"), body: destination.howToGetThere, fallback: t("howToGetThereFallback") },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(buildSchema(destination, locale, cover))} />

      {/* BREADCRUMB + BANNER IMAGE + INTRO + MAP */}
      <div className="bg-surface">
        <div className="relative isolate">
          <CmsImage media={cover} alt={cover?.alt || destination.name} placeholderName={destination.name} preload sizes="100vw" wrapperClassName="aspect-[4/3] min-h-[340px] max-h-[520px] w-full sm:aspect-[21/8] sm:min-h-[420px]" />
          <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-0 h-64 bg-linear-to-b from-black/65 to-transparent" />
          {/* Text shadow keeps the white breadcrumb readable over bright photos (white stupas, sky) */}
          <div className={`absolute inset-x-0 top-24 [text-shadow:0_1px_6px_rgb(0_0_0/0.75)] sm:top-28 ${locale === "ta" || locale === "hi" ? "xl:top-48" : ""}`}>
        <div className="container-page">
          <Breadcrumbs
            locale={locale}
            dots
            label={t("breadcrumb")}
            items={[{ label: tCommon("home"), href: "/" }, { label: listingPage?.page.title || t("destinationsLabel"), href: "/destinations" }, { label: destination.name }]}
          />
        </div>
          </div>
        </div>

        <div className="container-page">
          <section className="grid items-center gap-8 py-8 sm:py-10 md:grid-cols-[minmax(0,1.5fr)_minmax(0,0.8fr)] lg:gap-12" aria-labelledby="destination-title">
            {/* INTRO TEXT + BUTTONS */}
            <div className="min-w-0" data-scroll-reveal>
              {eyebrow && <DotEyebrow>{eyebrow}</DotEyebrow>}
              {destination.subtitle && <p className="mt-6 text-lg font-light text-muted sm:text-xl">{destination.subtitle}</p>}
              <h1
                id="destination-title"
                className="mt-3 wrap-break-word font-display text-[clamp(1.85rem,7vw,3.75rem)] md:text-[clamp(2.25rem,4.6vw,3.75rem)] leading-[1.12] tracking-tight text-ink"
                data-testid="destination-title"
              >
                {destination.name}
              </h1>
              <p className="mt-5 max-w-prose whitespace-pre-line text-base leading-7 text-muted">{intro}</p>
              <div className="mt-6 flex flex-wrap gap-3">
                <ButtonLink href="#plan-trip">{t("planTrip")}</ButtonLink>
                {hasTours && (
                  <ButtonLink variant="outline" href="#destination-tours">
                    {t("exploreTours")}
                  </ButtonLink>
                )}
              </div>
            </div>

            {/* MAP */}
            <div className="min-w-0" data-scroll-reveal>
              <div className="rounded-2xl border border-sand-200 bg-sand-50 px-3 pt-3 [&_svg]:max-w-55">
                <DestinationMap destination={destination} label={t("mapLabel", { name: destination.name })} unavailable={t("locationUnavailable")} caption={t("mapCaption")} />
              </div>
            </div>
          </section>
        </div>
      </div>

      <div className="container-page">
        {/* THINGS TO SEE */}
        <div className="mt-0">
          <FeaturedExperiences
            items={destination.featuredExperiences || []}
            labels={{
              eyebrow: t("thingsToSee"),
              heading: t("featuredExperiences"),
              subheading: t("inName", { name: destination.name }),
              readMore: tCommon("readMore"),
              readLess: t("readLess"),
            }}
          />
        </div>

        {/* STORY, HIGHLIGHTS, THINGS TO DO, GALLERY (each one only when it has content) */}
        {(story || destination.highlights?.length || destination.thingsToDo?.length || destination.gallery?.length) && (
          <div className="max-w-4xl border-t border-sand-200 py-8 sm:py-10">
            {story && (
              <DetailSection>
                <Markdown content={story} />
              </DetailSection>
            )}
            {destination.highlights?.length ? (
              <DetailSection title={t("highlights")}>
                <CheckList items={destination.highlights} />
              </DetailSection>
            ) : null}
            {destination.thingsToDo?.length ? (
              <DetailSection title={t("thingsToDo")}>
                <CheckList items={destination.thingsToDo} />
              </DetailSection>
            ) : null}
            {destination.gallery?.length ? (
              <DetailSection>
                <MediaStrip items={destination.gallery} label={destination.name} />
              </DetailSection>
            ) : null}
          </div>
        )}

        {/* PRACTICAL INFORMATION */}
        <section className="border-t border-sand-200 py-10 sm:py-12" aria-labelledby="practical-title">
          <DotEyebrow>{t("practicalEyebrow")}</DotEyebrow>
          <h2 id="practical-title" className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
            {t("practicalTitle")}
          </h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {/* BEST TIME + HOW TO GET THERE */}
            {infoCards.map(({ key, icon: Icon, title, body, fallback }) => (
              <div key={key} className="dest-card rounded-lg border border-sand-200 bg-surface p-5 sm:p-6" data-scroll-reveal>
                <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-100">
                  <Icon className="h-6 w-6 text-gold-600" aria-hidden strokeWidth={1.5} />
                </span>
                <h3 className="mt-4 font-display text-xl text-ink">{title}</h3>
                <p className="mt-3 whitespace-pre-line text-sm leading-7 text-muted">{body?.trim() || fallback}</p>
              </div>
            ))}

            {/* SUGGESTED ITINERARY */}
            <div className="dest-card rounded-lg border border-sand-200 bg-surface p-5 sm:p-6" data-scroll-reveal>
              <span className="inline-flex h-12 w-12 items-center justify-center rounded-full bg-gold-100">
                <Route className="h-6 w-6 text-gold-600" aria-hidden strokeWidth={1.5} />
              </span>
              <h3 className="mt-4 font-display text-xl text-ink">{t("itinerary")}</h3>
              {destination.itinerary?.length ? (
                <ol className="mt-3 space-y-3 text-sm leading-7 text-muted">
                  {destination.itinerary.map((step, index) => (
                    <li key={`${step.title}-${index}`} className="flex gap-3">
                      <span className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-sand-100 text-xs font-semibold text-brand">{index + 1}</span>
                      <span>
                        <span className="font-medium text-ink">{step.title}</span>
                        {step.description && <span className="block">{step.description}</span>}
                      </span>
                    </li>
                  ))}
                </ol>
              ) : (
                <p className="mt-3 text-sm leading-7 text-muted">{t("itineraryFallback", { name: destination.name })}</p>
              )}
            </div>
          </div>
        </section>
      </div>

      {/* PLAN YOUR TRIP (green band with enquiry + WhatsApp buttons) */}
      <section id="plan-trip" className="scroll-mt-28 bg-forest-800 py-10 text-white sm:py-12" aria-labelledby="plan-trip-title">
        <div className="container-page flex flex-col items-start gap-8 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-2xl">
            <DotEyebrow className="text-gold-400">{t("ctaEyebrow")}</DotEyebrow>
            <h2 id="plan-trip-title" className="mt-4 font-display text-3xl text-white sm:text-4xl">
              {t("ctaTitle", { name: destination.name })}
            </h2>
            <p className="mt-4 text-white/80">{t("ctaText")}</p>
          </div>
          <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
            <ButtonLink href="/tailor-made-tours" variant="outline-light" size="lg">
              {t("enquire")}
            </ButtonLink>
            {whatsapp && (
              <ButtonLink href="whatsapp" variant="whatsapp" size="lg" whatsapp={whatsapp}>
                {t("whatsapp")}
              </ButtonLink>
            )}
          </div>
        </div>
      </section>

      {/* TOURS THAT VISIT THIS DESTINATION */}
      {tours && hasTours && (
        <section id="destination-tours" className="scroll-mt-28 py-10 sm:py-12" aria-labelledby="destination-tours-title">
          <div className="container-page">
            <h2 id="destination-tours-title" className="mb-8 font-display text-3xl text-ink">
              {t("exploreTours")}
            </h2>
            <div className="grid-center-last grid grid-cols-1 gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {tours.items.map((tour, index, allTours) => (
                <div key={tour._id} {...reveal3d(index)}>
                  <TourCard tour={tour} hideDescription={sharedDescriptions(allTours).has(tour.shortDescription?.trim() ?? "")} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* NEARBY DESTINATIONS */}
      {relatedDestinations.length > 0 && (
        <section className="bg-sand-50 py-10 sm:py-12" aria-labelledby="nearby-title">
          <div className="container-page">
            <DotEyebrow>{t("nearbyEyebrow")}</DotEyebrow>
            <h2 id="nearby-title" className="mt-3 font-display text-3xl tracking-tight text-ink sm:text-4xl">
              {t("nearby")}
            </h2>
            <div className="mt-6">
              <NearbyCarousel items={relatedDestinations} />
            </div>
          </div>
        </section>
      )}
    </>
  );
}
