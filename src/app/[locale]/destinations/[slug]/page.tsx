import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { CalendarDays, MapPin } from "lucide-react";
import { getDetail, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/config";
import { CmsImage } from "@/components/ui/CmsImage";
import { ButtonLink } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { DestinationCard, TourCard } from "@/components/cards/cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CheckList, DetailSection, MediaStrip } from "@/components/site/DetailBits";
import { TransferRates } from "@/components/site/TransferRates";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("destinations", slug, locale);
  if (!data) return {};
  const d = data.item;
  return buildMetadata({ locale, path: `/destinations/${d.slug}`, title: d.name, description: d.shortDescription || d.description, image: d.heroMedia, seo: d.seo });
}

export default async function DestinationDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [data, listing, settings, t, tc] = await Promise.all([
    getDetail("destinations", slug, locale),
    getPage("destinations", locale),
    getSiteSettings(locale),
    getTranslations("destination"),
    getTranslations("common"),
  ]);
  if (!data) notFound();
  const d = data.item;
  const tours = await getList("tours", { locale, destination: d._id, limit: 3 });

  const schema = {
    "@context": "https://schema.org",
    "@type": "TouristDestination",
    name: d.name,
    description: d.shortDescription,
    url: `${SITE_URL}/${locale}/destinations/${d.slug}`,
    ...(d.heroMedia?.url ? { image: d.heroMedia.url } : {}),
    ...(d.location?.lat && d.location?.lng ? { geo: { "@type": "GeoCoordinates", latitude: d.location.lat, longitude: d.location.lng } } : {}),
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <section className="relative isolate flex min-h-[70vh] items-end overflow-hidden bg-forest-900 text-white">
        <CmsImage media={d.heroMedia} alt={d.heroMedia?.alt || d.name} priority wrapperClassName="absolute inset-0 -z-10" className="animate-ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950 via-forest-950/40 to-forest-950/20" />
        <div className="container-page pb-14 pt-40">
          <Breadcrumbs locale={locale} items={[{ label: tc("home"), href: "/" }, { label: listing?.page.title ?? "", href: "/destinations" }, { label: d.name }]} />
          {d.region && (
            <p className="eyebrow mb-3 flex items-center gap-1 text-gold-400">
              <MapPin className="h-3.5 w-3.5" /> {d.region}
            </p>
          )}
          <h1 className="text-5xl sm:text-7xl" data-testid="destination-title">
            {d.name}
          </h1>
          {d.shortDescription && <p className="mt-5 max-w-2xl text-lg text-white/80">{d.shortDescription}</p>}
        </div>
      </section>

      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <DetailSection>
            <Markdown content={d.description} />
          </DetailSection>
          {d.highlights?.length ? (
            <DetailSection title={t("highlights")}>
              <CheckList items={d.highlights} />
            </DetailSection>
          ) : null}
          {d.thingsToDo?.length ? (
            <DetailSection title={t("thingsToDo")}>
              <CheckList items={d.thingsToDo} />
            </DetailSection>
          ) : null}
          {d.gallery?.length ? (
            <DetailSection>
              <MediaStrip items={d.gallery} label={d.name} />
            </DetailSection>
          ) : null}
        </div>
        <aside className="space-y-6 lg:sticky lg:top-28 lg:self-start">
          {d.bestTimeToVisit && (
            <div className="rounded-3xl bg-forest-800 p-7 text-white">
              <p className="eyebrow mb-2 flex items-center gap-1 text-gold-400">
                <CalendarDays className="h-4 w-4" /> {t("bestTime")}
              </p>
              <p className="text-white/85">{d.bestTimeToVisit}</p>
            </div>
          )}
          <div className="rounded-3xl bg-white p-7 shadow-card">
            <p className="font-display text-2xl text-forest-900">{t("planTrip")}</p>
            <div className="mt-5 flex flex-col gap-3">
              <ButtonLink href="/tailor-made-tours" className="w-full">
                {t("planTrip")}
              </ButtonLink>
              <ButtonLink href="/booking" variant="outline" className="w-full">
                {tc("bookNow")}
              </ButtonLink>
            </div>
          </div>
        </aside>
      </div>

      {tours?.items.length ? (
        <section className="py-14">
          <div className="container-page">
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {tours.items.map((tour) => (
                <TourCard key={tour._id} tour={tour} />
              ))}
            </div>
          </div>
        </section>
      ) : null}

      <TransferRates settings={settings} />

      {data.related.length > 0 && (
        <section className="bg-sand-100 py-16">
          <div className="container-page">
            <h2 className="mb-10 text-3xl text-forest-900">{t("related")}</h2>
            <div className="grid gap-5 sm:grid-cols-3">
              {data.related.map((r) => (
                <DestinationCard key={r._id} destination={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
