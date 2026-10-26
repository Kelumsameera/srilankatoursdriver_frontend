import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import type { Tour } from "@/types/cms";
import { EmptyState, SectionHeading } from "@/components/ui/misc";
import { ToursHero } from "@/components/sections/ToursHero";
import { tourHeroMedia } from "@/lib/tour-hero";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { CategoryFilter, FilterBar, FilterDivider, Pagination, TourDaysFilter, pageParam, param, tourDaysParam, type SearchParams } from "@/components/site/listing";
import { reveal3d } from "@/lib/reveal";
import { seasonFirst, seasonMonths } from "@/lib/season";
import { PageRenderer, hasActiveHero } from "@/components/sections/PageRenderer";

// /en/tours?category=cultural&days=5&page=2 -> Next.js gives us the locale from the URL and the ?query values
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
  // Tour length chip: 5, 8, 10, 12, 14 days, one day ("1") or "other"
  const days = tourDaysParam(query);
  const page = pageParam(query);
  // "All" shows every tour in season groups on one page; a category filter keeps the paged grid
  const grouped = !category;

  const [pageData, categories, tourList, settings, tCommon, tTour] = await Promise.all([
    getPage("tours", locale),
    getCategories("tour", locale),
    getList("tours", grouped ? { locale, limit: 60, days } : { locale, page, limit: 12, category, days }),
    getSiteSettings(locale),
    getTranslations("common"),
    getTranslations("tour"),
  ]);
  const selectedCategory = categories?.find((item) => item.slug === category || item._id === category);
  const repeatedDescriptions = sharedDescriptions(tourList?.items ?? []);
  const tours = tourList?.items ?? [];
  // A selected category uses its own CMS video; otherwise a video set as the page's header image
  // (Admin → Pages → Tours), else the bundled coastal footage.
  const pageHero = pageData?.page.heroImage?.url ? pageData.page.heroImage : undefined;
  const pageVideo = pageHero?.resourceType === "video" ? pageHero : undefined;
  const hero = tourHeroMedia(selectedCategory?.slug ?? category, selectedCategory?.heroVideo ?? pageVideo);

  const grid = (items: Tour[]) => (
    <div className="grid-center-last grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3" data-testid="tour-list">
      {items.map((tour, index) => (
        <div key={tour._id} {...reveal3d(index)}>
          <TourCard tour={tour} hideDescription={repeatedDescriptions.has(tour.shortDescription?.trim() ?? "")} />
        </div>
      ))}
    </div>
  );

  // Season groups: in season now on top, day tours and the rest in the middle, off season at the bottom
  const inSeason = tours.filter((t) => t.seasonRank === 0);
  const middle = tours.filter((t) => t.seasonRank !== 0 && t.seasonRank !== 3);
  const offSeason = tours.filter((t) => t.seasonRank === 3);
  const seasonGroups = [
    { key: "in-season", items: inSeason, eyebrow: tTour("inSeason"), title: inSeason[0]?.category?.name, months: seasonMonths(inSeason[0], locale) },
    { key: "more", items: middle, eyebrow: undefined, title: tTour("moreTours"), months: undefined },
    { key: "off-season", items: offSeason, eyebrow: tTour("offSeason"), title: offSeason[0]?.category?.name, months: seasonMonths(offSeason[0], locale) },
  ].filter((g) => g.items.length > 0);

  return (
    <>
      {/* HERO */}
      {pageData && hasActiveHero(pageData.sections) ? <PageRenderer sections={pageData.sections} settings={settings} part="hero" /> : <ToursHero title={pageData?.page.title || tTour("moreTours")} subtitle={pageData?.page.subtitle} image={pageHero && !pageVideo ? pageHero : hero.poster} video={hero.video} />}

      {/* TOUR LIST: category chips, cards, pages – less space above so the filters sit close to the hero */}
      <section id="tour-packages" className="scroll-mt-28 pb-section pt-8 md:pt-10">
        <div className="container-page">
          {/* Seasonal packages lead the category chips, then the tour length chips – one compact group of about two lines */}
          <div className="mb-12 rounded-2xl border border-sand-200 bg-surface p-5 shadow-card sm:p-7">
          <FilterBar>
            <CategoryFilter basePath="/tours" categories={seasonFirst(categories ?? [])} active={category} query={{ days }} className="" inline />
            <FilterDivider />
            <TourDaysFilter basePath="/tours" active={days} category={category} inline />
          </FilterBar>
          </div>
          {selectedCategory?.description && (
            <div className="mb-8 max-w-4xl">
              <h2 className="font-display text-3xl text-heading">{selectedCategory.name}</h2>
              <p className="mt-3 text-base leading-7 text-muted">{selectedCategory.description}</p>
            </div>
          )}
          {!tours.length ? (
            <EmptyState text={tCommon("noResults")} />
          ) : grouped ? (
            <div className="space-y-16 md:space-y-24">
              {seasonGroups.map((g) => (
                <div key={g.key} data-testid={`tour-group-${g.key}`} className="border-t border-sand-200 pt-8 first:border-t-0 first:pt-0">
                  <SectionHeading eyebrow={g.eyebrow} title={g.title} badge={g.months} />
                  {grid(g.items)}
                </div>
              ))}
            </div>
          ) : (
            grid(tours)
          )}
          {tourList && !grouped && <Pagination meta={tourList.meta} basePath="/tours" query={{ category, days }} />}
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "tours" page, except its hero (shown above) */}
      {pageData && <PageRenderer sections={pageData.sections} settings={settings} part="body" content={pageData?.page.content} />}
    </>
  );
}
