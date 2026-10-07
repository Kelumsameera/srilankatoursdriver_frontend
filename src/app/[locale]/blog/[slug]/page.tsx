import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { getDetail, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { SITE_URL } from "@/lib/config";
import { formatDate } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { Markdown } from "@/components/ui/Markdown";
import { Badge } from "@/components/ui/misc";
import { BlogCard } from "@/components/cards/cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("blog", slug, locale);
  if (!data) return {};
  const p = data.item;
  return buildMetadata({
    locale,
    path: `/blog/${p.slug}`,
    title: p.title,
    description: p.excerpt || p.content,
    image: p.coverImage,
    seo: p.seo,
    type: "article",
    publishedTime: p.publishDate,
  });
}

export default async function BlogPostPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [data, listing, settings, t, tc] = await Promise.all([
    getDetail("blog", slug, locale),
    getPage("blog", locale),
    getSiteSettings(locale),
    getTranslations("blog"),
    getTranslations("common"),
  ]);
  if (!data) notFound();
  const post = data.item;
  const loc = await getLocale();
  const schema = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.excerpt,
    datePublished: post.publishDate,
    dateModified: post.updatedAt ?? post.publishDate,
    url: `${SITE_URL}/${locale}/blog/${post.slug}`,
    ...(post.coverImage?.url ? { image: post.coverImage.url } : {}),
    author: { "@type": post.author ? "Person" : "Organization", name: post.author || settings?.businessName },
    publisher: settings ? { "@type": "Organization", name: settings.businessName } : undefined,
  };

  return (
    <article>
      <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />
      <header className="relative isolate overflow-hidden bg-forest-900 text-white">
        <CmsImage media={post.coverImage} alt={post.coverImage?.alt || post.title} priority wrapperClassName="absolute inset-0 -z-10 opacity-70" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950 via-forest-950/60 to-forest-950/30" />
        <div className="container-page max-w-4xl pb-14 pt-40 sm:pt-48">
          <Breadcrumbs locale={locale} items={[{ label: tc("home"), href: "/" }, { label: listing?.page.title ?? "", href: "/blog" }, { label: post.title }]} />
          {post.category?.name && <Badge className="mb-4 bg-gold-500/20 text-gold-200">{post.category.name}</Badge>}
          <h1 className="text-4xl leading-tight sm:text-5xl">{post.title}</h1>
          <p className="mt-5 flex flex-wrap gap-x-3 text-sm text-white/70">
            {post.author && <span>{t("by", { author: post.author })}</span>}
            {post.publishDate && <time dateTime={post.publishDate}>{formatDate(post.publishDate, loc, { dateStyle: "long" })}</time>}
            {post.readingMinutes ? <span>· {tc("minRead", { count: post.readingMinutes })}</span> : null}
          </p>
        </div>
      </header>
      <div className="container-page max-w-3xl py-14">
        {post.excerpt && <p className="mb-8 font-display text-xl leading-relaxed text-forest-800">{post.excerpt}</p>}
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
      </div>
      {data.related.length > 0 && (
        <section className="bg-sand-100 py-16">
          <div className="container-page">
            <h2 className="mb-10 text-3xl text-forest-900">{t("related")}</h2>
            <div className="grid gap-10 md:grid-cols-3">
              {data.related.map((p) => (
                <BlogCard key={p._id} post={p} />
              ))}
            </div>
          </div>
        </section>
      )}
    </article>
  );
}
