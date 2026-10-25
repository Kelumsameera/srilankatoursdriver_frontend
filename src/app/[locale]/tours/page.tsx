import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import type { Tour } from "@/types/cms";
import { PageHero, EmptyState, SectionHeading } from "@/components/ui/misc";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { CategoryFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
import { reveal3d } from "@/lib/reveal";
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

// Seasonal package months – keep in sync with seasonalTourCategories() in backend/src/services/public.service.ts
const SEASON_MONTHS: Record<string, [number, number]> = { "east-coast-tours": [7, 10], "down-south-tours": [11, 6] };

// Slug of the seasonal category in season now (Sri Lanka time), e.g. "east-coast-tours" in August
function inSeasonCategory(now = new Date()) {
  const month = Number(new Intl.DateTimeFormat("en-US", { timeZone: "Asia/Colombo", month: "numeric" }).format(now));
  return Object.keys(SEASON_MONTHS).find((slug) => {
    const [from, to] = SEASON_MONTHS[slug];
    return from <= to ? month >= from && month <= to : month >= from || month <= to;
  });
}

// Intl gives the traditional Sinhala names (ඇසළ, වප් …); visitors know the everyday Gregorian ones
const SI_MONTHS = ["ජනවාරි", "පෙබරවාරි", "මාර්තු", "අප්‍රේල්", "මැයි", "ජූනි", "ජූලි", "අගෝස්තු", "සැප්තැම්බර්", "ඔක්තෝබර්", "නොවැම්බර්", "දෙසැම්බර්"];

// "July – October" in the page's language
function seasonMonths(tour: Tour | undefined, locale: string) {
  const range = tour?.category?.slug ? SEASON_MONTHS[tour.category.slug] : undefined;
  if (!range) return undefined;
  const month = new Intl.DateTimeFormat(locale, { month: "long", timeZone: "UTC" });
  const name = (m: number) => (locale === "si" ? SI_MONTHS[m - 1] : month.format(new Date(Date.UTC(2026, m - 1, 15))));
  return range.map(name).join(" – ");
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
  // "All" shows every tour in season groups on one page; a category filter keeps the paged grid
  const grouped = !category;

  const [pageData, categories, tourList, settings, tCommon, tTour] = await Promise.all([
    getPage("tours", locale),
    getCategories("tour", locale),
    getList("tours", grouped ? { locale, limit: 60 } : { locale, page, limit: 12, category }),
    getSiteSettings(locale),
    getTranslations("common"),
    getTranslations("tour"),
  ]);
  const selectedCategory = categories?.find((item) => item.slug === category || item._id === category);
  const repeatedDescriptions = sharedDescriptions(tourList?.items ?? []);
  const tours = tourList?.items ?? [];
  // Header video of the seasonal category in season now (set in Admin → Tour categories)
  const seasonVideo = categories?.find((c) => c.slug === inSeasonCategory())?.heroVideo;

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
      {pageData && hasActiveHero(pageData.sections) ? <PageRenderer sections={pageData.sections} settings={settings} part="hero" /> : <PageHero title={pageData?.page.title ?? ""} subtitle={pageData?.page.subtitle} image={pageData?.page.heroImage} banner="tours" video={seasonVideo} />}

      {/* TOUR LIST: category chips, cards, pages */}
      <section className="py-section">
        <div className="container-page">
          <CategoryFilter basePath="/tours" categories={categories ?? []} active={category} />
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
                <div key={g.key} data-testid={`tour-group-${g.key}`}>
                  <SectionHeading eyebrow={g.eyebrow} title={g.title} badge={g.months} />
                  {grid(g.items)}
                </div>
              ))}
            </div>
          ) : (
            grid(tours)
          )}
          {tourList && !grouped && <Pagination meta={tourList.meta} basePath="/tours" query={{ category }} />}
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "tours" page, except its hero (shown above) */}
      {pageData && <PageRenderer sections={pageData.sections} settings={settings} part="body" content={pageData?.page.content} />}
    </>
  );
}
