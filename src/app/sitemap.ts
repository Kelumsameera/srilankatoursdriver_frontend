import type { MetadataRoute } from "next";
import { getSitemapData } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";
import { defaultLocale, locales, localeTags } from "@/i18n/routing";

export const revalidate = 3600;

const STATIC_PATHS = ["", "/about", "/tours", "/destinations", "/excursions", "/vehicles", "/tailor-made-tours", "/gallery", "/blog", "/reviews", "/faqs", "/contact", "/booking"];

function entry(path: string, lastModified?: string, priority = 0.6): MetadataRoute.Sitemap[number] {
  return {
    url: `${SITE_URL}/${defaultLocale}${path}`,
    // Static routes get no lastmod rather than "now" – a constantly changing date is ignored by crawlers.
    ...(lastModified ? { lastModified: new Date(lastModified) } : {}),
    priority,
    alternates: {
      languages: { ...Object.fromEntries(locales.map((l) => [localeTags[l], `${SITE_URL}/${l}${path}`])), "x-default": `${SITE_URL}/${defaultLocale}${path}` },
    },
  };
}

/** sitemap.xml with hreflang alternates for all 14 languages, generated from MongoDB content. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const data = await getSitemapData();
  const items: MetadataRoute.Sitemap = STATIC_PATHS.map((p) => entry(p, undefined, p === "" ? 1 : 0.8));
  if (data) {
    data.tours.forEach((t) => items.push(entry(`/tours/${t.slug}`, t.updatedAt, 0.9)));
    data.destinations.forEach((d) => items.push(entry(`/destinations/${d.slug}`, d.updatedAt, 0.8)));
    data.excursions.forEach((e) => items.push(entry(`/excursions/${e.slug}`, e.updatedAt, 0.7)));
    data.vehicles?.forEach((v) => items.push(entry(`/vehicles/${v.slug}`, v.updatedAt, 0.6)));
    data.blog.forEach((b) => items.push(entry(`/blog/${b.slug}`, b.updatedAt, 0.6)));
    // Custom pages only – a slug shadowed by a built-in route (or "home") would 404 at /[slug].
    data.pages.filter((p) => p.slug && p.slug !== "home" && !STATIC_PATHS.includes(`/${p.slug}`)).forEach((p) => items.push(entry(`/${p.slug}`, p.updatedAt, 0.3)));
  }
  return items;
}
