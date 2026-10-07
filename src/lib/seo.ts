import type { Metadata } from "next";
import { SITE_URL } from "@/lib/config";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { locales, localeTags, defaultLocale } from "@/i18n/routing";
import type { MediaAsset, Seo, SiteSettings } from "@/types/cms";
import { getBranding, getSeo, getSiteSettings } from "@/lib/api/server";
import { stripMarkdown } from "@/lib/utils";

/** hreflang alternates for a locale-less path like "/tours/ella". */
export function alternates(path: string, locale: string) {
  const clean = path === "/" ? "" : path;
  return {
    canonical: `${SITE_URL}/${locale}${clean}`,
    languages: {
      ...Object.fromEntries(locales.map((l) => [localeTags[l], `${SITE_URL}/${l}${clean}`])),
      "x-default": `${SITE_URL}/${defaultLocale}${clean}`,
    },
  };
}

function ogImage(media?: MediaAsset | null) {
  if (!media?.url) return undefined;
  // Wide logos are padded (not cropped) so the whole mark stays visible in link previews.
  const isLogo = media.publicId?.includes("/branding/");
  const url = isLogo
    ? media.url.replace("/upload/", "/upload/c_pad,w_1200,h_630,b_white,f_png/")
    : cloudinaryUrl(media.url, { width: 1200, height: 630, crop: "fill" });
  return [{ url, width: 1200, height: 630, alt: media.alt ?? "" }];
}

function robots(value?: string): Metadata["robots"] {
  const v = (value ?? "index,follow").toLowerCase();
  return { index: !v.includes("noindex"), follow: !v.includes("nofollow") };
}

interface BuildInput {
  locale: string;
  path: string;
  /** Fallback title/description when the entity has no explicit SEO values. */
  title?: string;
  description?: string;
  image?: MediaAsset | null;
  seo?: Seo;
  /** SeoMetadata route key (e.g. "tours") for listing pages. */
  routeKey?: string;
  type?: "website" | "article";
  publishedTime?: string;
}

/** Builds Next.js metadata from CMS SEO fields with sensible fallbacks. */
export async function buildMetadata(input: BuildInput): Promise<Metadata> {
  const [settings, seoData, branding] = await Promise.all([getSiteSettings(input.locale), getSeo(input.routeKey ?? "global"), getBranding()]);
  const route = seoData?.route;
  const global = seoData?.global;
  const s = input.seo ?? {};
  const title = s.seoTitle || route?.seoTitle || input.title || global?.seoTitle || settings?.siteName || "";
  const description = stripMarkdown(s.metaDescription || route?.metaDescription || input.description || global?.metaDescription || "", 300);
  // Fallback chain: entity SEO image → route default → entity hero → global default → brand logo.
  const image = s.ogImage?.url
    ? s.ogImage
    : route?.ogImage?.url
      ? route.ogImage
      : input.image?.url
        ? input.image
        : global?.ogImage?.url
          ? global.ogImage
          : branding?.primaryLogo;
  const alt = alternates(input.path, input.locale);

  return {
    title,
    description,
    keywords: s.keywords?.length ? s.keywords : route?.keywords?.length ? route.keywords : global?.keywords,
    alternates: { ...alt, canonical: s.canonicalUrl || route?.canonicalUrl || alt.canonical },
    robots: robots(s.robots || route?.robots || global?.robots),
    openGraph: {
      type: input.type ?? "website",
      title: s.ogTitle || route?.ogTitle || title,
      description: s.ogDescription || route?.ogDescription || description,
      url: alt.canonical,
      siteName: settings?.businessName,
      locale: localeTags[input.locale as keyof typeof localeTags] ?? input.locale,
      images: ogImage(image),
      ...(input.publishedTime ? { publishedTime: input.publishedTime } : {}),
    },
    twitter: {
      card: image?.url ? "summary_large_image" : "summary",
      title: s.ogTitle || title,
      description,
      images: ogImage(image)?.map((i) => i.url),
      ...(global?.twitterHandle ? { site: global.twitterHandle } : {}),
    },
  };
}

/** Organisation / travel agency JSON-LD from Site Settings. */
export function organizationJsonLd(settings: SiteSettings, logoUrl?: string) {
  const sameAs = Object.values(settings.social ?? {}).filter(Boolean);
  return {
    "@context": "https://schema.org",
    "@type": "TravelAgency",
    name: settings.businessName,
    url: settings.websiteUrl || SITE_URL,
    ...(logoUrl ? { logo: logoUrl, image: logoUrl } : {}),
    ...(settings.email ? { email: settings.email } : {}),
    ...(settings.phone ? { telephone: settings.phone } : {}),
    ...(settings.address ? { address: { "@type": "PostalAddress", streetAddress: settings.address, addressCountry: "LK" } } : {}),
    ...(settings.googleMapsUrl ? { hasMap: settings.googleMapsUrl } : {}),
    ...(/24\s*hours/i.test(settings.businessHours ?? "")
      ? {
          openingHoursSpecification: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
            opens: "00:00",
            closes: "23:59",
          },
        }
      : {}),
    ...(sameAs.length ? { sameAs } : {}),
  };
}

/** Serialises JSON-LD safely for a <script> tag (prevents "</script>" injection). */
export function jsonLd(data: unknown) {
  return { __html: JSON.stringify(data).replace(/</g, "\\u003c") };
}
