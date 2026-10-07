import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { setRequestLocale } from "next-intl/server";
import { getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/misc";
import { Markdown } from "@/components/ui/Markdown";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string; slug: string }> };

// System pages have their own routes; only custom CMS pages (privacy-policy, about-us …) render here.
const SYSTEM = new Set(["home", "tours", "destinations", "excursions", "vehicles", "tailor-made-tours", "gallery", "blog", "reviews", "contact", "booking", "faqs"]);

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  if (SYSTEM.has(slug)) return {};
  const data = await getPage(slug, locale);
  if (!data) return {};
  return buildMetadata({ locale, path: `/${slug}`, seo: data.page.seo, title: data.page.title, description: data.page.subtitle || data.page.content, image: data.page.heroImage });
}

export default async function CmsPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  if (SYSTEM.has(slug) || !/^[a-z0-9-]{1,120}$/.test(slug)) notFound();
  const [data, settings] = await Promise.all([getPage(slug, locale), getSiteSettings(locale)]);
  if (!data) notFound();
  return (
    <>
      <PageHero title={data.page.title} subtitle={data.page.subtitle} image={data.page.heroImage} />
      {data.page.content && (
        <section className="py-14 sm:py-20">
          <div className="container-page max-w-3xl">
            <Markdown content={data.page.content} />
          </div>
        </section>
      )}
      <PageRenderer sections={data.sections} settings={settings} />
    </>
  );
}
