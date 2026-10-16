import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { PageHero, EmptyState } from "@/components/ui/misc";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { CategoryFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
import { PageRenderer, hasActiveHero } from "@/components/sections/PageRenderer";

// /en/tours?category=cultural&page=2 -> Next.js gives us the locale from the URL and the ?query values
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pageData = await getPage("tours", locale);
  return buildMetadata({
    locale,
    path: "/tours",
    routeKey: "tours",
    seo: pageData?.page.seo,
    title: pageData?.page.title,
    description: pageData?.page.subtitle,
    image: pageData?.page.heroImage,
  });
}

// This is a server component (no "use client"): the data is fetched on the server,
// so Google sees the full list of tours in the HTML.
export default async function ToursPage({ params, searchParams }: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const query = await searchParams;
  const category = param(query, "category");
  const page = pageParam(query);

  const [pageData, categories, tourList, settings, tCommon] = await Promise.all([
    getPage("tours", locale),
    getCategories("tour", locale),
    getList("tours", { locale, page, limit: 12, category }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);
  const repeatedDescriptions = sharedDescriptions(tourList?.items ?? []);

  return (
    <>
      {/* HERO */}
      {pageData && hasActiveHero(pageData.sections) ? <PageRenderer sections={pageData.sections} settings={settings} part="hero" /> : <PageHero title={pageData?.page.title ?? ""} subtitle={pageData?.page.subtitle} image={pageData?.page.heroImage} banner="tours" />}

      {/* TOUR LIST: category chips, cards, pages */}
      <section className="py-section">
        <div className="container-page">
          <CategoryFilter basePath="/tours" categories={categories ?? []} active={category} />
          {tourList?.items.length ? (
            <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3" data-testid="tour-list">
              {tourList.items.map((tour) => (
                <TourCard key={tour._id} tour={tour} hideDescription={repeatedDescriptions.has(tour.shortDescription?.trim() ?? "")} />
              ))}
            </div>
          ) : (
            <EmptyState text={tCommon("noResults")} />
          )}
          {tourList && <Pagination meta={tourList.meta} basePath="/tours" query={{ category }} />}
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "tours" page, except its hero (shown above) */}
      {pageData && <PageRenderer sections={pageData.sections} settings={settings} part="body" content={pageData?.page.content} />}
    </>
  );
}
