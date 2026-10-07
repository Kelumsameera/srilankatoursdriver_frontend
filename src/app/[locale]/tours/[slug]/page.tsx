import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { BedDouble, Calendar, Car, Flag, MapPin, Mountain, UserRound } from "lucide-react";
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
import { TourCard } from "@/components/cards/cards";
import { FaqList } from "@/components/sections/FaqList";
import { CheckList, DetailSection, FactList, MediaStrip } from "@/components/site/DetailBits";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("tours", slug, locale);
  if (!data) return {};
  const tour = data.item;
  return buildMetadata({ locale, path: `/tours/${tour.slug}`, title: tour.title, description: tour.shortDescription || tour.description, image: tour.heroMedia, seo: tour.seo });
}

export default async function TourDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [data, listing, settings, t, tc] = await Promise.all([
    getDetail("tours", slug, locale),
    getPage("tours", locale),
    getSiteSettings(locale),
    getTranslations("tour"),
    getTranslations("common"),
  ]);
  if (!data) notFound();
  const tour = data.item;
  const price = formatPrice(tour.price, tour.currency, await getLocale());
  const bookHref = `/booking?type=tour&tour=${tour._id}`;
  const enquireMsg = `${settings?.whatsappMessage ?? ""} ${tour.title}`.trim();

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristTrip",
    name: tour.title,
    description: tour.shortDescription,
    url: `${SITE_URL}/${locale}/tours/${tour.slug}`,
    ...(tour.heroMedia?.url ? { image: tour.heroMedia.url } : {}),
    ...(tour.itinerary?.length
      ? { itinerary: { "@type": "ItemList", itemListElement: tour.itinerary.map((d, i) => ({ "@type": "ListItem", position: i + 1, name: d.title })) } }
      : {}),
    ...(tour.price ? { offers: { "@type": "Offer", price: tour.price, priceCurrency: tour.currency ?? "USD", availability: "https://schema.org/InStock" } } : {}),
    ...(settings ? { provider: { "@type": "TravelAgency", name: settings.businessName, telephone: settings.phone } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <section className="relative isolate overflow-hidden bg-forest-900 text-white">
        <CmsImage media={tour.heroMedia} alt={tour.heroMedia?.alt || tour.title} priority wrapperClassName="absolute inset-0 -z-10" className="animate-ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/30" />
        <div className="container-page pb-14 pt-40 sm:pt-52">
          <Breadcrumbs
            locale={locale}
            items={[
              { label: tc("home"), href: "/" },
              { label: listing?.page.title ?? "", href: "/tours" },
              { label: tour.title },
            ]}
          />
          {tour.category?.name && <Badge className="mb-4 bg-gold-500/20 text-gold-200">{tour.category.name}</Badge>}
          <h1 className="max-w-4xl text-4xl leading-tight sm:text-5xl lg:text-6xl" data-testid="tour-title">
            {tour.title}
          </h1>
          {tour.shortDescription && <p className="mt-5 max-w-3xl text-lg text-white/80">{tour.shortDescription}</p>}
          <div className="mt-10 border-t border-white/15 pt-8">
            <FactList
              facts={[
                {
                  icon: <Calendar className="h-5 w-5" />,
                  label: t("duration"),
                  value: tour.durationDays
                    ? `${tc("days", { count: tour.durationDays })}${tour.durationNights ? ` / ${tc("nights", { count: tour.durationNights })}` : ""}`
                    : undefined,
                },
                {
                  icon: <MapPin className="h-5 w-5" />,
                  label: t("route"),
                  value: tour.startLocation ? `${tour.startLocation}${tour.endLocation && tour.endLocation !== tour.startLocation ? ` → ${tour.endLocation}` : ""}` : undefined,
                },
                { icon: <Mountain className="h-5 w-5" />, label: t("difficulty"), value: tour.difficulty ? t(tour.difficulty) : undefined },
                { icon: <Flag className="h-5 w-5" />, label: t("destinations"), value: tour.destinations?.length ? String(tour.destinations.length) : undefined },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0">
          <DetailSection title={t("overview")} id="overview">
            <Markdown content={tour.description} />
            {tour.highlights?.length ? (
              <div className="mt-8 rounded-3xl bg-forest-50 p-7">
                <h3 className="mb-4 text-xl text-forest-900">{t("highlights")}</h3>
                <CheckList items={tour.highlights} />
              </div>
            ) : null}
          </DetailSection>

          {tour.itinerary?.length ? (
            <DetailSection title={t("itinerary")} id="itinerary">
              <ol className="relative space-y-8 border-s-2 border-dashed border-gold-200 ps-8">
                {tour.itinerary.map((day) => (
                  <li key={day._id ?? day.day} className="relative">
                    <span className="absolute -start-[2.85rem] top-0 flex h-10 w-10 items-center justify-center rounded-full bg-forest-800 text-xs font-semibold text-gold-400 ring-4 ring-sand-50">
                      {day.day}
                    </span>
                    <p className="eyebrow text-[0.68rem]">{t("dayLabel", { day: day.day })}</p>
                    <h3 className="mt-1 text-xl text-forest-900">{day.title}</h3>
                    {day.image?.url && <CmsImage media={day.image} alt={day.title} sizes="(min-width:1024px) 600px, 100vw" wrapperClassName="mt-4 aspect-[16/9] rounded-2xl" />}
                    <Markdown content={day.description} className="mt-3 text-[0.95rem]" />
                    {day.activities?.length ? (
                      <ul className="mt-4 flex flex-wrap gap-2">
                        {day.activities.map((a) => (
                          <li key={a}>
                            <Badge className="bg-sand-100 text-earth-700">{a}</Badge>
                          </li>
                        ))}
                      </ul>
                    ) : null}
                    {day.overnight && (
                      <p className="mt-3 flex items-center gap-2 text-sm text-muted">
                        <BedDouble className="h-4 w-4 text-forest-600" aria-hidden /> {t("overnight")}: {day.overnight}
                      </p>
                    )}
                  </li>
                ))}
              </ol>
            </DetailSection>
          ) : null}

          {tour.included?.length || tour.excluded?.length ? (
            <DetailSection id="included">
              <div className="grid gap-10 sm:grid-cols-2">
                {tour.included?.length ? (
                  <div>
                    <h2 className="mb-5 text-2xl text-forest-900">{t("included")}</h2>
                    <CheckList items={tour.included} />
                  </div>
                ) : null}
                {tour.excluded?.length ? (
                  <div>
                    <h2 className="mb-5 text-2xl text-forest-900">{t("excluded")}</h2>
                    <CheckList items={tour.excluded} negative />
                  </div>
                ) : null}
              </div>
            </DetailSection>
          ) : null}

          {tour.hotels?.length ? (
            <DetailSection title={t("hotels")}>
              <ul className="grid gap-4 sm:grid-cols-2">
                {tour.hotels.map((h, i) => (
                  <li key={`${h.name}-${i}`} className="rounded-2xl border border-sand-200 bg-white p-5">
                    <p className="font-medium text-forest-900">{h.url ? <a href={h.url} target="_blank" rel="noopener noreferrer" className="hover:underline">{h.name}</a> : h.name}</p>
                    <p className="text-sm text-muted">{[h.location, h.category, h.nights ? tc("nights", { count: h.nights }) : null].filter(Boolean).join(" · ")}</p>
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {(tour.vehicle || tour.driver?.description) && (
            <DetailSection>
              <div className="grid gap-6 sm:grid-cols-2">
                {tour.vehicle && (
                  <div className="overflow-hidden rounded-3xl border border-sand-200 bg-white">
                    <CmsImage media={tour.vehicle.images?.[0]} alt={tour.vehicle.name} sizes="400px" wrapperClassName="aspect-[16/9] bg-sand-100" />
                    <div className="p-5">
                      <p className="eyebrow mb-1 flex items-center gap-1 text-[0.68rem]"><Car className="h-3.5 w-3.5" /> {t("vehicle")}</p>
                      <p className="text-lg text-forest-900">{tour.vehicle.name}</p>
                      <p className="text-sm text-muted">
                        {[tour.vehicle.seats ? tc("seats", { count: tour.vehicle.seats }) : null, tour.vehicle.airConditioning ? tc("airConditioned") : null].filter(Boolean).join(" · ")}
                      </p>
                    </div>
                  </div>
                )}
                {tour.driver?.description && (
                  <div className="rounded-3xl bg-forest-800 p-7 text-white">
                    <p className="eyebrow mb-3 flex items-center gap-1 text-gold-400"><UserRound className="h-4 w-4" /> {t("driver")}</p>
                    {tour.driver.name && <p className="font-display text-2xl">{tour.driver.name}</p>}
                    <p className="mt-2 text-white/80">{tour.driver.description}</p>
                    {tour.driver.languages?.length ? <p className="mt-4 text-sm text-white/60">{t("languages")}: {tour.driver.languages.join(", ")}</p> : null}
                  </div>
                )}
              </div>
            </DetailSection>
          )}

          {tour.destinations?.length ? (
            <DetailSection title={t("destinations")}>
              <ul className="flex flex-wrap gap-2">
                {tour.destinations.map((d) => (
                  <li key={d._id}>
                    <CmsLink href={`/destinations/${d.slug}`} className="inline-flex items-center gap-1.5 rounded-full border border-sand-200 bg-white px-4 py-2 text-sm hover:border-forest-800">
                      <MapPin className="h-3.5 w-3.5 text-gold-600" aria-hidden /> {d.name}
                    </CmsLink>
                  </li>
                ))}
              </ul>
            </DetailSection>
          ) : null}

          {tour.gallery?.length ? (
            <DetailSection>
              <MediaStrip items={tour.gallery} label={tour.title} />
            </DetailSection>
          ) : null}

          {tour.faqs?.length ? (
            <DetailSection title={t("faqs")}>
              <FaqList items={tour.faqs} />
            </DetailSection>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-white p-7 shadow-card">
            {price ? (
              <>
                <p className="text-sm text-muted">{tc("from")}</p>
                <p className="font-display text-4xl text-forest-800">{price}</p>
                {tour.priceNote && <p className="mt-1 text-sm text-muted">{tour.priceNote}</p>}
              </>
            ) : (
              <p className="font-display text-2xl text-forest-800">{tour.priceNote || tc("priceOnRequest")}</p>
            )}
            <p className="mt-4 text-sm leading-relaxed text-muted">{t("customise")}</p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href={bookHref} size="lg" className="w-full">
                {t("bookThisTour")}
              </ButtonLink>
              {settings?.whatsapp && (
                <a href={whatsappLink(settings.whatsapp, enquireMsg)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "lg", "w-full")}>
                  <SocialIcons.whatsapp className="h-5 w-5" /> {tc("chatOnWhatsapp")}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>

      {data.related.length > 0 && (
        <section className="bg-sand-100 py-16">
          <div className="container-page">
            <h2 className="mb-10 text-3xl text-forest-900">{t("related")}</h2>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((r) => (
                <TourCard key={r._id} tour={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
