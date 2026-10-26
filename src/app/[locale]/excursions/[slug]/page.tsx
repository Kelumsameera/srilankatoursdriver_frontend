import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, MapPin, Tag } from "lucide-react";
import { getDetail, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { SocialIcons } from "@/components/ui/icons";
import { ExcursionCard } from "@/components/cards/ExcursionCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CheckList, DetailSection, FactList, MediaStrip } from "@/components/site/DetailBits";
import { travelImageFor } from "@/lib/editorial-images";
import { reveal3d } from "@/lib/reveal";
import type { Excursion } from "@/types/cms";

// /en/excursions/kandy -> Next.js gives us the locale and the slug from the URL
type Props = { params: Promise<{ locale: string; slug: string }> };

/** Generate each published excursion on its first visit, then reuse the tagged ISR cache. */
export function generateStaticParams() {
  return [];
}

// The big hero picture. A video can't be used here, so fall back to a matching editorial photo.
function heroImageFor(excursion: Excursion) {
  return excursion.heroMedia?.url && excursion.heroMedia.resourceType !== "video"
    ? excursion.heroMedia
    : travelImageFor(`${excursion.slug} ${excursion.title} ${excursion.location ?? ""} ${excursion.destination?.name ?? ""}`);
}

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("excursions", slug, locale);
  if (!data) return {};
  const excursion = data.item;
  return buildMetadata({
    locale,
    path: `/excursions/${excursion.slug}`,
    title: excursion.title,
    description: excursion.shortDescription || excursion.description,
    image: heroImageFor(excursion),
    seo: excursion.seo,
  });
}

// This is a server component (no "use client"): the excursion is fetched on the server,
// so Google sees the full description in the HTML.
export default async function ExcursionDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);

  const [data, listingPage, settings, t, tCommon, tTour] = await Promise.all([
    getDetail("excursions", slug, locale),
    // The /excursions CMS page, only for its title in the breadcrumbs
    getPage("excursions", locale),
    getSiteSettings(locale),
    getTranslations("excursion"),
    getTranslations("common"),
    getTranslations("tour"),
  ]);
  // Unknown or unpublished slug: notFound() shows the site's 404 page with a real 404 status
  if (!data) notFound();

  const excursion = data.item;
  const heroImage = heroImageFor(excursion);
  const price = formatPrice(excursion.price, excursion.currency, locale);
  const whatsappMessage = `${settings?.whatsappMessage ?? ""} ${excursion.title}`.trim();

  return (
    <>
      {/* HERO: title, short text and the key facts */}
      <section className="relative isolate overflow-hidden bg-forest-900 text-white">
        <CmsImage media={heroImage} alt={heroImage.alt || excursion.title} preload wrapperClassName="absolute inset-0 -z-10" className="animate-ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950 via-forest-950/55 to-forest-950/25" />
        <div className="container-page pb-14 pt-40 sm:pt-52">
          <Breadcrumbs
            locale={locale}
            items={[
              { label: tCommon("home"), href: "/" },
              { label: listingPage?.page.title ?? "", href: "/excursions" },
              { label: excursion.title },
            ]}
          />
          <h1 className="max-w-4xl text-h1 leading-tight">{excursion.title}</h1>
          {excursion.shortDescription && <p className="mt-5 max-w-3xl text-lead text-white/80">{excursion.shortDescription}</p>}

          {/* FACTS: duration, place, price */}
          <div className="mt-10 border-t border-white/15 pt-8">
            <FactList
              facts={[
                { icon: <Clock className="h-5 w-5" />, label: t("duration"), value: excursion.duration },
                { icon: <MapPin className="h-5 w-5" />, label: t("location"), value: excursion.location || excursion.destination?.name },
                { icon: <Tag className="h-5 w-5" />, label: tCommon("from"), value: price ?? excursion.priceNote ?? undefined },
              ]}
            />
          </div>
        </div>
      </section>

      <div className="container-page grid grid-cols-1 gap-12 py-14 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          {/* DESCRIPTION */}
          <DetailSection>
            <Markdown content={excursion.description} />
          </DetailSection>

          {/* HIGHLIGHTS */}
          {excursion.highlights?.length ? (
            <DetailSection title={tTour("highlights")}>
              <CheckList items={excursion.highlights} />
            </DetailSection>
          ) : null}

          {/* INCLUDED */}
          {excursion.included?.length ? (
            <DetailSection title={t("included")}>
              <CheckList items={excursion.included} />
            </DetailSection>
          ) : null}

          {/* GALLERY */}
          {excursion.gallery?.length ? (
            <DetailSection>
              <MediaStrip items={excursion.gallery} label={excursion.title} />
            </DetailSection>
          ) : null}
        </div>

        {/* PRICE BOX: sticky next to the content on desktop, below it on phones */}
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-surface p-7 shadow-card">
            {/* "From" above a real price, like the tour price box */}
            {price && <p className="text-sm text-muted">{tCommon("from")}</p>}
            <p className="font-display text-3xl text-brand">{price ?? (excursion.priceNote || tCommon("priceOnRequest"))}</p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href={`/booking?type=excursion&excursion=${excursion._id}`} size="lg" className="w-full">
                {t("book")}
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

      {/* RELATED EXCURSIONS */}
      {data.related.length > 0 && (
        <section className="bg-sand-100 py-section-sm">
          <div className="container-page">
            <h2 className="mb-10 text-h2 text-heading">{t("related")}</h2>
            <div className="grid-center-last grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((relatedExcursion, index) => (
                <div key={relatedExcursion._id} {...reveal3d(index)}>
                  <ExcursionCard excursion={relatedExcursion} />
                </div>
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
