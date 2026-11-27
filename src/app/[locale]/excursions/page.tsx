import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { ExcursionCard } from "@/components/cards/ExcursionCard";
import { LocationFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
import { reveal3d } from "@/lib/reveal";
import { PageRenderer, hasActiveHero } from "@/components/sections/PageRenderer";

// /en/excursions?category=day-trips&page=2 -> Next.js gives us the locale from the URL and the ?query values
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pageData = await getPage("excursions", locale);
  return buildMetadata({
    locale,
    path: "/excursions",
    routeKey: "excursions",
    seo: pageData?.page.seo,
    title: pageData?.page.title,
    description: pageData?.page.subtitle,
    image: pageData?.page.heroImage,
  });
}

// This is a server component (no "use client"): the data is fetched on the server,
// so Google sees the full list of excursions in the HTML.
export default async function ExcursionsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const query = await searchParams;
  const requestedLocation = param(query, "location");
  const page = pageParam(query);

  // Fetch every published excursion once so the location filter reflects the actual data
  // (including locations added later through the admin CMS) without a separate endpoint.
  const allExcursions: { location?: string | null }[] = [];
  let currentPage = 1;
  let totalPages = 1;
  do {
    const result = await getList("excursions", { locale, page: currentPage, limit: 60 });
    allExcursions.push(...(result?.items ?? []));
    totalPages = result?.meta?.totalPages ?? 1;
    currentPage += 1;
  } while (currentPage <= totalPages && currentPage <= 20);

  const locationMap = new Map<string, string>();
  for (const item of allExcursions) {
    const value = (item.location ?? "").trim();
    if (value) {
      const key = value.toLowerCase();
      if (!locationMap.has(key)) locationMap.set(key, value);
    }
  }
  const locations = [...locationMap.values()].sort((a, b) => a.localeCompare(b, locale));

  // Ignore invalid/unavailable locations so a stale URL cannot create a dead filter state.
  const locationValues = new Set(locationMap.values());
  const activeLocation = requestedLocation && locationValues.has(requestedLocation) ? requestedLocation : undefined;

  const [pageData, excursionList, settings, tCommon] = await Promise.all([
    getPage("excursions", locale),
    getList("excursions", { locale, page, limit: 12, location: activeLocation }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);

  return (
    <>
      {/* HERO */}
      {pageData && hasActiveHero(pageData.sections) ? <PageRenderer sections={pageData.sections} settings={settings} part="hero" /> : <PageHero title={pageData?.page.title ?? ""} subtitle={pageData?.page.subtitle} image={pageData?.page.heroImage} banner="excursions" />}

      {/* EXCURSION LIST: location chips, cards, pages */}
      <section className="py-section">
        <div className="container-page">
          <LocationFilter basePath="/excursions" locations={locations} active={activeLocation} />
          {excursionList?.items.length ? (
            <div className="grid-center-last grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
              {/* A-Z by the (translated) title */}
              {[...excursionList.items].sort((a, b) => a.title.localeCompare(b.title, locale)).map((excursion, index) => (
                <div key={excursion._id} {...reveal3d(index)}>
                  <ExcursionCard excursion={excursion} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text={tCommon("noResults")} />
          )}
          {excursionList && <Pagination meta={excursionList.meta} basePath="/excursions" query={{ location: activeLocation }} />}
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "excursions" page, except its hero (shown above) */}
      {pageData && <PageRenderer sections={pageData.sections} settings={settings} part="body" content={pageData?.page.content} />}
    </>
  );
}
