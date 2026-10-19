import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getFeed, getPage, getSiteSettings, getStories } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { param, type SearchParams } from "@/components/site/listing";
import { PageRenderer } from "@/components/sections/PageRenderer";
import { CommunityFeed } from "@/components/community/CommunityFeed";
import { FEED_FILTERS, type FeedFilter } from "@/lib/feed";

// /en/blog?q=ella&type=photos&category=travel-tips -> Next.js gives us the locale and the ?query values
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

/**
 * The blog is a Facebook-style community feed: travel articles, guest stories, photos and reels in one timeline,
 * with a search bar and a menu (blog categories sit under "Articles").
 * Server component: the first posts are fetched on the server, so Google sees them in the HTML;
 * the feed component loads more in the browser while scrolling.
 */
export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);
  const query = await searchParams;
  const q = param(query, "q")?.slice(0, 100) ?? "";
  const category = param(query, "category");
  const requested = param(query, "type");
  const type: FeedFilter = category ? "articles" : FEED_FILTERS.includes(requested as FeedFilter) ? (requested as FeedFilter) : "all";

  const [pageData, categories, feed, reels, settings, t] = await Promise.all([
    getPage("blog", locale),
    getCategories("blog", locale),
    getFeed({ page: 1, limit: 8, q: q || undefined, type, category }),
    getStories({ video: true, limit: 12 }),
    getSiteSettings(locale),
    getTranslations("stories"),
  ]);

  return (
    <>
      {/* Room for the fixed header (64px, 80px from xl). Keep in sync with components/site/SiteHeader.tsx */}
      <section className="bg-sand-100 pb-section pt-24 xl:pt-28">
        <div className="container-page max-w-7xl">
          {/* TITLE (from the CMS "blog" page) */}
          <header className="mb-6">
            <h1 className="text-h2 text-forest-900">{pageData?.page.title || t("feedTitle")}</h1>
            <p className="mt-1 text-muted">{pageData?.page.subtitle || t("feedSubtitle")}</p>
          </header>

          {/* FEED: menu, search, share box, reels row, articles + stories */}
          <CommunityFeed
            initialItems={feed?.items ?? []}
            initialMeta={feed?.meta ?? { page: 1, limit: 8, total: 0, totalPages: 0 }}
            initialQuery={q}
            initialType={type}
            initialCategory={category}
            categories={categories ?? []}
            reels={reels?.items ?? []}
          />
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "blog" page, except its hero */}
      {pageData && <PageRenderer sections={pageData.sections} settings={settings} part="body" content={pageData.page.content} />}
    </>
  );
}
