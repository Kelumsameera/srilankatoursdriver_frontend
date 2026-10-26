import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getDetail, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { Markdown } from "@/components/ui/Markdown";
import { Engagement } from "@/components/community/Engagement";
import { Badge } from "@/components/ui/misc";
import { BlogCard } from "@/components/cards/BlogCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { travelImageFor } from "@/lib/editorial-images";
import type { BlogPost } from "@/types/cms";

// /en/blog/best-time-to-visit -> Next.js gives us the locale and the slug from the URL
type Props = { params: Promise<{ locale: string; slug: string }> };

/** No paths at build time: each one is rendered on its first visit, then cached and revalidated (ISR). */
export function generateStaticParams() {
  return [];
}

// The cover picture. A video can't be used here, so fall back to a matching editorial photo.
function coverImageFor(post: BlogPost) {
  return post.coverImage?.url && post.coverImage.resourceType !== "video"
    ? post.coverImage
    : travelImageFor(`${post.slug} ${post.title} ${post.category?.name ?? ""}`);
}

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("blog", slug, locale);
  if (!data) return {};
  const post = data.item;
  return buildMetadata({
    locale,
    path: `/blog/${post.slug}`,
    title: post.title,
    description: post.excerpt || post.content,
    image: coverImageFor(post),
    seo: post.seo,
    type: "article",
    publishedTime: post.publishDate,
  });
}

// This is a server component (no "use client"): the post is fetched on the server,
// so Google sees the whole article in the HTML.
export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);

  const [data, listingPage, settings, t, tCommon] = await Promise.all([
    getDetail("blog", slug, locale),
    // The /blog CMS page, only for its title in the breadcrumbs
    getPage("blog", locale),
    getSiteSettings(locale),
    getTranslations("blog"),
    getTranslations("common"),
  ]);
  // Unknown or unpublished slug: notFound() shows the site's 404 page with a real 404 status
  if (!data) notFound();

  const post = data.item;
  const coverImage = coverImageFor(post);

  // Structured data for Google (schema.org BlogPosting)
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishDate,
    dateModified: post.updatedAt ?? post.publishDate,
    url: `${SITE_URL}/${locale}/blog/${post.slug}`,
    ...(coverImage.url ? { image: coverImage.url } : {}),
    author: { "@type": post.author ? "Person" : "Organization", name: post.author || settings?.businessName },
    publisher: settings ? { "@type": "Organization", name: settings.businessName } : undefined,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />

      {/* HEADER: cover, category, title, author / date / reading time */}
      <header className="relative isolate overflow-hidden bg-forest-900 text-white">
        <CmsImage media={coverImage} alt={coverImage.alt || post.title} preload wrapperClassName="absolute inset-0 -z-10 opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/30" />
        <div className="container-page max-w-4xl pb-14 pt-40 sm:pt-48">
          <Breadcrumbs
            locale={locale}
            items={[
              { label: tCommon("home"), href: "/" },
              { label: listingPage?.page.title ?? "", href: "/blog" },
              { label: post.title },
            ]}
          />
          {post.category?.name && <Badge className="mb-4 bg-gold-500/20 text-gold-200">{post.category.name}</Badge>}
          <h1 className="text-4xl leading-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-5 flex flex-wrap gap-x-3 text-sm text-white/70">
            {post.author && <span>{t("by", { author: post.author })}</span>}
            {post.publishDate && <time dateTime={post.publishDate}>{formatDate(post.publishDate, locale, { dateStyle: "long" })}</time>}
            {post.readingMinutes ? <span>· {tCommon("minRead", { count: post.readingMinutes })}</span> : null}
          </p>
        </div>
      </header>

      {/* ARTICLE: excerpt, content, tags */}
      <div className="container-page max-w-3xl py-14">
        {post.excerpt && <p className="mb-8 font-display text-xl leading-relaxed text-brand">{post.excerpt}</p>}
        <Markdown content={post.content} />
        {post.tags?.length ? (
          <ul className="mt-10 flex flex-wrap gap-2">
            {post.tags.map((tag) => (
              <li key={tag}>
                <Badge className="bg-sand-100 text-earth-700">#{tag}</Badge>
              </li>
            ))}
          </ul>
        ) : null}

        {/* LIKES, SHARE BUTTONS, COMMENTS */}
        <Engagement type="blog" id={post.slug} title={post.title} url={`${SITE_URL}/${locale}/blog/${post.slug}`} path={`/blog/${post.slug}`} />
      </div>

      {/* RELATED POSTS */}
      {data.related.length > 0 && (
        <section className="bg-sand-100 py-section-sm">
          <div className="container-page">
            <h2 className="mb-10 text-h2 text-heading">{t("related")}</h2>
            <div className="grid grid-cols-1 gap-10 md:grid-cols-3">
              {data.related.map((relatedPost) => (
                <BlogCard key={relatedPost._id} post={relatedPost} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
