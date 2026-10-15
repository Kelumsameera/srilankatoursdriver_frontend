import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { BlogCard } from "@/components/cards/BlogCard";
import { CategoryFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
import { PageRenderer, hasActiveHero } from "@/components/sections/PageRenderer";

// /en/blog?category=travel-tips&page=2 -> Next.js gives us the locale from the URL and the ?query values
type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pageData = await getPage("blog", locale);
  return buildMetadata({
    locale,
    path: "/blog",
    routeKey: "blog",
    seo: pageData?.page.seo,
    title: pageData?.page.title,
    description: pageData?.page.subtitle,
    image: pageData?.page.heroImage,
  });
}

// This is a server component (no "use client"): the data is fetched on the server,
// so Google sees the list of posts in the HTML.
export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const query = await searchParams;
  const category = param(query, "category");
  const page = pageParam(query);

  const [pageData, categories, postList, settings, tCommon] = await Promise.all([
    getPage("blog", locale),
    getCategories("blog", locale),
    getList("blog", { locale, page, limit: 9, category }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);

  return (
    <>
      {/* HERO */}
      {pageData && hasActiveHero(pageData.sections) ? <PageRenderer sections={pageData.sections} settings={settings} part="hero" /> : <PageHero title={pageData?.page.title ?? ""} subtitle={pageData?.page.subtitle} image={pageData?.page.heroImage} banner="blog" />}

      {/* POST LIST: category chips, cards, pages */}
      <section className="py-section">
        <div className="container-page">
          <CategoryFilter basePath="/blog" categories={categories ?? []} active={category} />
          {postList?.items.length ? (
            <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {postList.items.map((post) => (
                <BlogCard key={post._id} post={post} />
              ))}
            </div>
          ) : (
            <EmptyState text={tCommon("noResults")} />
          )}
          {postList && <Pagination meta={postList.meta} basePath="/blog" query={{ category }} />}
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "blog" page, except its hero (shown above) */}
      {pageData && <PageRenderer sections={pageData.sections} settings={settings} part="body" />}
    </>
  );
}
