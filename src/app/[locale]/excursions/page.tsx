import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { ExcursionCard } from "@/components/cards/ExcursionCard";
import { CategoryFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
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
  const category = param(query, "category");
  const page = pageParam(query);

  const [pageData, categories, excursionList, settings, tCommon] = await Promise.all([
    getPage("excursions", locale),
    getCategories("excursion", locale),
    getList("excursions", { locale, page, limit: 12, category }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);

  return (
    <>
      {/* HERO */}
      {pageData && hasActiveHero(pageData.sections) ? <PageRenderer sections={pageData.sections} settings={settings} part="hero" /> : <PageHero title={pageData?.page.title ?? ""} subtitle={pageData?.page.subtitle} image={pageData?.page.heroImage} banner="excursions" />}

      {/* EXCURSION LIST: category chips, cards, pages */}
      <section className="py-section">
        <div className="container-page">
          <CategoryFilter basePath="/excursions" categories={categories ?? []} active={category} />
          {excursionList?.items.length ? (
            <div className="grid-center-last grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
              {excursionList.items.map((excursion, index) => (
                <div key={excursion._id} {...reveal3d(index)}>
                  <ExcursionCard excursion={excursion} />
                </div>
              ))}
            </div>
          ) : (
            <EmptyState text={tCommon("noResults")} />
          )}
          {excursionList && <Pagination meta={excursionList.meta} basePath="/excursions" query={{ category }} />}
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "excursions" page, except its hero (shown above) */}
      {pageData && <PageRenderer sections={pageData.sections} settings={settings} part="body" content={pageData?.page.content} />}
    </>
  );
}
