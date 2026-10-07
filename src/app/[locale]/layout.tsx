import type { Metadata, Viewport } from "next";
import type { CSSProperties, ReactNode } from "react";
import { notFound } from "next/navigation";
import { NextIntlClientProvider } from "next-intl";
import { getMessages, getTranslations, setRequestLocale } from "next-intl/server";
import { isLocale, locales, rtlLocales, type Locale } from "@/i18n/routing";
import { getBranding, getLanguages, getList, getNavigation, getSeo, getSiteSettings } from "@/lib/api/server";
import { SITE_URL } from "@/lib/config";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { alternates, jsonLd, organizationJsonLd } from "@/lib/seo";
import { SiteHeader } from "@/components/site/SiteHeader";
import { SiteFooter } from "@/components/site/SiteFooter";
import { WhatsAppFloat } from "@/components/site/WhatsAppFloat";
import { Logo } from "@/components/site/Logo";
import type { SiteSettings } from "@/types/cms";

export function generateStaticParams() {
  return locales.map((locale) => ({ locale }));
}

type Props = { children: ReactNode; params: Promise<{ locale: string }> };

export const viewport: Viewport = {
  themeColor: "#08261a",
  width: "device-width",
  initialScale: 1,
};

/** Site-wide metadata: everything (name, favicon, verification, defaults) comes from the CMS. */
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const [settings, branding, seo] = await Promise.all([getSiteSettings(locale), getBranding(), getSeo("global")]);
  const siteName = settings?.siteName ?? "";
  // "{siteName}" in the SEO title template is replaced with the Site Settings value, so renaming the site updates every title.
  const template = (seo?.global?.titleTemplate?.includes("%s") ? seo.global.titleTemplate : "%s | {siteName}").replace(/\{siteName\}/g, siteName);
  const faviconUrl = branding?.favicon?.url;
  return {
    metadataBase: new URL(SITE_URL),
    title: { default: (seo?.global?.seoTitle || siteName).replace(/\{siteName\}/g, siteName), template },
    description: seo?.global?.metaDescription || settings?.tagline,
    applicationName: siteName,
    alternates: alternates("/", locale),
    icons: faviconUrl
      ? {
          icon: [
            { url: cloudinaryUrl(faviconUrl, { width: 32, height: 32, crop: "fill", format: "png" }), sizes: "32x32" },
            { url: cloudinaryUrl(faviconUrl, { width: 192, height: 192, crop: "fill", format: "png" }), sizes: "192x192" },
          ],
          apple: cloudinaryUrl(faviconUrl, { width: 180, height: 180, crop: "fill", format: "png" }),
        }
      : { icon: "/favicon-fallback.svg" },
    ...(seo?.global?.googleSiteVerification ? { verification: { google: seo.global.googleSiteVerification } } : {}),
    openGraph: { siteName: settings?.businessName, type: "website" },
  };
}

const EMPTY_SETTINGS: SiteSettings = { siteName: "", businessName: "" };

export default async function LocaleLayout({ children, params }: Props) {
  const { locale } = await params;
  if (!isLocale(locale)) notFound();
  setRequestLocale(locale);

  const [settingsRes, branding, nav, languages, footerTours, footerDestinations, messages, t] = await Promise.all([
    getSiteSettings(locale),
    getBranding(),
    getNavigation(locale),
    getLanguages(),
    getList("tours", { locale, featured: true, limit: 5 }),
    getList("destinations", { locale, featured: true, limit: 8 }),
    getMessages(),
    getTranslations({ locale, namespace: "common" }),
  ]);
  const settings = settingsRes ?? EMPTY_SETTINGS;
  const enabledLanguages = languages?.filter((l) => l.enabled).map((l) => l.code) ?? [...locales];
  const dir = rtlLocales.includes(locale as Locale) ? "rtl" : "ltr";
  const brandStyle = {
    ...(branding?.colors?.primary ? { "--brand-primary": branding.colors.primary } : {}),
    ...(branding?.colors?.secondary ? { "--brand-secondary": branding.colors.secondary } : {}),
    ...(branding?.colors?.accent ? { "--brand-accent": branding.colors.accent } : {}),
  } as CSSProperties;
  const whatsapp = { phone: settings.whatsapp, message: settings.whatsappMessage };

  return (
    <html lang={locale} dir={dir} style={brandStyle}>
      <body className="flex min-h-dvh flex-col">
        <a href="#main" className="sr-only z-50 rounded bg-white px-4 py-2 focus:not-sr-only focus:fixed focus:start-4 focus:top-4">
          {t("skipToContent")}
        </a>
        <NextIntlClientProvider locale={locale} messages={messages}>
          <SiteHeader
            nav={nav ?? []}
            languages={enabledLanguages}
            phone={settings.phone}
            whatsapp={whatsapp}
            logoLight={<Logo branding={branding} siteName={settings.siteName} tone="light" priority />}
            logoDark={<Logo branding={branding} siteName={settings.siteName} tone="dark" />}
            logoMobile={<Logo branding={branding} siteName={settings.siteName} tone="dark" mobile className="max-h-10" />}
            logoMobileLight={<Logo branding={branding} siteName={settings.siteName} tone="light" mobile className="max-h-10" />}
          />
          {!settingsRes && (
            <div role="status" className="fixed inset-x-0 top-20 z-30 bg-gold-100 px-4 py-2 text-center text-sm text-earth-700">
              {(await getTranslations({ locale, namespace: "errors" }))("unavailable")}
            </div>
          )}
          <main id="main" className="flex-1">
            {children}
          </main>
          {settingsRes && (
            <SiteFooter settings={settings} branding={branding} tours={footerTours?.items ?? []} destinations={footerDestinations?.items ?? []} />
          )}
          <WhatsAppFloat phone={settings.whatsapp} message={settings.whatsappMessage} />
        </NextIntlClientProvider>
        {settingsRes && (
          <script
            type="application/ld+json"
            dangerouslySetInnerHTML={jsonLd(organizationJsonLd(settings, branding?.primaryLogo?.url))}
          />
        )}
      </body>
    </html>
  );
}
