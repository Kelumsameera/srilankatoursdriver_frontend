import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata, jsonLd } from "@/lib/seo";
import { stripMarkdown } from "@/lib/utils";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { FaqList } from "@/components/sections/FaqList";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("faqs", locale);
  return buildMetadata({ locale, path: "/faqs", routeKey: "faqs", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function FaqsPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, list, settings, t] = await Promise.all([getPage("faqs", locale), getList("faqs", { locale, limit: 60 }), getSiteSettings(locale), getTranslations("common")]);
  const faqs = list?.items ?? [];
  const groups = faqs.reduce<Record<string, typeof faqs>>((acc, f) => {
    const key = f.category || "";
    (acc[key] ??= []).push(f);
    return acc;
  }, {});
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({ "@type": "Question", name: f.question, acceptedAnswer: { "@type": "Answer", text: stripMarkdown(f.answer, 1000) } })),
  };

  return (
    <>
      {faqs.length > 0 && <script type="application/ld+json" dangerouslySetInnerHTML={jsonLd(schema)} />}
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-14 sm:py-20">
        <div className="container-page max-w-3xl space-y-12">
          {faqs.length === 0 && <EmptyState text={t("noResults")} />}
          {Object.entries(groups).map(([category, items]) => (
            <div key={category || "general"}>
              {category && Object.keys(groups).length > 1 && <h2 className="mb-5 text-2xl text-forest-900">{category}</h2>}
              <FaqList items={items} />
            </div>
          ))}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
