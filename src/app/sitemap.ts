import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";
import { localeTags } from "@/i18n/routing";
import type { SiteLanguages } from "@/i18n/site-languages";
import { getSiteLanguages } from "@/lib/seo";

export const revalidate = 3600;

const STATIC_PATHS = ["", "/about", "/tours", "/destinations", "/excursions", "/offers", "/tailor-made-tours", "/gallery", "/blog", "/reels", "/reviews", "/faqs", "/contact", "/booking"];

function siteEntry(site: SiteLanguages, path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}/${site.defaultLocale}${path}`,
    // Static routes get no lastmod rather than "now" – a constantly changing date is ignored by crawlers.
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    priority,
    alternates: {
      languages: { ...Object.fromEntries(site.enabled.map((l) => [localeTags[l], `${SITE_URL}/${l}${path}`])), "x-default": `${SITE_URL}/${site.defaultLocale}${path}` },
    },
  };
}

/** sitemap.xml with hreflang alternates for the enabled languages, generated from MongoDB content. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [data, site] = await Promise.all([getSitemapData(), getSiteLanguages()]);
  const entry = (path: string, lastModified?: string, priority?: number) => siteEntry(site, path, lastModified, priority);
  const items: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => entry(p, undefined, p === "" ? 1 : 0.8));
  if (data) {
    data.tours.forEach((t) => items.push(entry(`/tours/${t.slug}`, t.updatedAt, 0.9)));
    data.destinations.forEach((d) => items.push(entry(`/destinations/${d.slug}`, d.updatedAt, 0.8)));
    data.excursions.forEach((e) => items.push(entry(`/excursions/${e.slug}`, e.updatedAt, 0.7)));
    data.blog.forEach((b) => items.push(entry(`/blog/${b.slug}`, b.updatedAt, 0.6)));
    // Custom pages only – a slug shadowed by a built-in route (or "home") would 404 at /[slug].
    data.pages.filter((p) => p.slug && p.slug !== "home" && p.slug !== "vehicles" && !STATIC_PATHS.includes(`/${p.slug}`)).forEach((p) => items.push(entry(`/${p.slug}`, p.updatedAt, 0.3)));
  }
  return items;
}
