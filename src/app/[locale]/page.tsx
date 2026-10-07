import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { PageRenderer } from "@/components/sections/PageRenderer";
import { PageHero } from "@/components/ui/misc";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("home", locale);
  const meta = await buildMetadata({ locale, path: "/", routeKey: "home", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle });
  // The homepage uses the plain title (no template suffix).
  return { ...meta, title: { absolute: String(meta.title ?? "") } };
}

/** Homepage – every section, its order and visibility is controlled in Admin → Homepage. */
export default async function HomePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, settings] = await Promise.all([getPage("home", locale), getSiteSettings(locale)]);
  if (!data) {
    const t = await getTranslations("errors");
    return <PageHero title={settings?.siteName ?? ""} subtitle={t("unavailable")} />;
  }
  const hasHero = data.sections.some((s) => s.type === "hero" && Array.isArray(s.data) && s.data.length > 0);
  return (
    <>
      {!hasHero && <PageHero title={data.page.title} subtitle={data.page.subtitle} image={data.page.heroImage} />}
      <PageRenderer sections={data.sections} settings={settings} />
    </>
  );
}
