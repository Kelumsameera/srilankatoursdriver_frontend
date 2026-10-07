import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getPreviewPage, getSiteSettings } from "@/lib/api/server";
import { PageHero } from "@/components/ui/misc";
import { Markdown } from "@/components/ui/Markdown";
import { PageRenderer } from "@/components/sections/PageRenderer";
import { param, type SearchParams } from "@/components/site/listing";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { robots: { index: false, follow: false } };

type Props = { params: Promise<{ locale: string; slug: string }>; searchParams: SearchParams };

/** Admin preview (opened from Admin → Pages). Shows disabled sections; requires a short-lived token. */
export default async function PreviewPage({ params, searchParams }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const token = param(await searchParams, "token");
  if (!token) notFound();
  const [data, settings, t] = await Promise.all([getPreviewPage(slug, locale, token), getSiteSettings(locale), getTranslations("preview")]);
  if (!data) notFound();
  const hasHero = data.sections.some((s) => s.type === "hero" && Array.isArray(s.data) && s.data.length > 0);
  return (
    <>
      <div className="fixed inset-x-0 bottom-0 z-50 bg-gold-500 px-4 py-2 text-center text-sm font-medium text-forest-950">{t("banner")}</div>
      {!hasHero && <PageHero title={data.page.title} subtitle={data.page.subtitle} image={data.page.heroImage} />}
      {data.page.content && (
        <div className="container-page max-w-3xl py-14">
          <Markdown content={data.page.content} />
        </div>
      )}
      <PageRenderer sections={data.sections} settings={settings} preview />
    </>
  );
}
