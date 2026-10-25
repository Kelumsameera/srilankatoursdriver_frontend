import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { param, type SearchParams } from "@/components/site/listing";
import {
  PageRenderer,
  hasActiveHero,
} from "@/components/sections/PageRenderer";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { DotEyebrow } from "@/components/destinations/Eyebrow";
import { DestinationsBrowser } from "@/components/destinations/DestinationsBrowser";
import { PageBody } from "@/components/ui/PageBody";

// /en/destinations -> Next.js gives us the locale from the URL and the ?query values
type Props = {
  params: Promise<{ locale: string }>;
  searchParams: SearchParams;
};

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pageData = await getPage("destinations", locale);
  return buildMetadata({
    locale,
    path: "/destinations",
    routeKey: "destinations",
    seo: pageData?.page.seo,
    title: pageData?.page.title,
    description: pageData?.page.subtitle,
    image: pageData?.page.heroImage,
  });
}

// This is a server component (no "use client"): the data is fetched on the server,
// so Google sees the full list of destinations in the HTML.
export default async function DestinationsPage({
  params,
  searchParams,
}: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const query = await searchParams;

  const [pageData, destinationList, settings, t, tCommon] = await Promise.all([
    getPage("destinations", locale),
    // Every published destination in one request (API maximum 60). Filtering happens in the browser.
    getList("destinations", { locale, limit: 60 }),
    getSiteSettings(locale),
    getTranslations("destination"),
    getTranslations("common"),
  ]);
  const title = pageData?.page.title || t("destinationsLabel");

  return (
    <>
      {/* The page-level hero image selected in Admin takes priority over section heroes. */}
      {pageData?.page.heroImage?.url ? (
        <PageHero
          title={title}
          subtitle={pageData.page.subtitle}
          image={pageData.page.heroImage}
          banner="destinations"
          eyebrow={t("listEyebrow")}
        >
          <PageBody content={pageData.page.content} disclosure={{ more: tCommon("readMore"), less: t("readLess") }} overlay />
        </PageHero>
      ) : pageData && hasActiveHero(pageData.sections) ? (
        <PageRenderer
          sections={pageData.sections}
          settings={settings}
          part="hero"
        />
      ) : (
        <section
          className="bg-surface pb-10 pt-24 sm:pb-14 sm:pt-28"
          aria-labelledby="destinations-title"
        >
          <div className="container-page">
            <Breadcrumbs
              locale={locale}
              onLight
              dots
              label={t("breadcrumb")}
              items={[{ label: tCommon("home"), href: "/" }, { label: title }]}
            />
            <div className="max-w-3xl py-6 sm:py-10" data-scroll-reveal>
              <DotEyebrow>{t("listEyebrow")}</DotEyebrow>
              <h1
                id="destinations-title"
                className="mt-5 font-display text-[clamp(1.85rem,7vw,3.75rem)] uppercase leading-[1.05] tracking-[0.04em] text-ink sm:tracking-[0.08em]"
              >
                {title}
              </h1>
              {(pageData ? pageData.page.subtitle : t("listIntro")) && (
                <p className="mt-6 text-base leading-8 text-muted sm:text-lg">
                  {pageData ? pageData.page.subtitle : t("listIntro")}
                </p>
              )}
            </div>
          </div>
        </section>
      )}

      {!pageData?.page.heroImage?.url && <PageBody content={pageData?.page.content} disclosure={{ more: tCommon("readMore"), less: t("readLess") }} />}

      {/* CATEGORY FILTER + DESTINATION CARDS */}
      <section className="border-t border-sand-200 bg-surface pb-10 pt-5 sm:pb-24 sm:pt-10">
        <div className="container-page">
          {destinationList?.items.length ? (
            <DestinationsBrowser
              destinations={destinationList.items}
              eagerFirstImage={!pageData?.page.heroImage?.url && !(pageData && hasActiveHero(pageData.sections))}
              initialCategory={param(query, "category")}
            />
          ) : (
            <EmptyState text={tCommon("noResults")} />
          )}
        </div>
      </section>

      {/* EXTRA SECTIONS ADDED IN THE ADMIN (the hero is shown at the top) */}
      {pageData && (
        <PageRenderer
          sections={pageData.sections}
          settings={settings}
          part="body"
        />
      )}
    </>
  );
}
