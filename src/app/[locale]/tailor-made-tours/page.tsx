import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/misc";
import { Markdown } from "@/components/ui/Markdown";
import { TailorMadeForm } from "@/components/forms/TailorMadeForm";
import { PageRenderer, hasActiveHero } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("tailor-made-tours", locale);
  return buildMetadata({ locale, path: "/tailor-made-tours", routeKey: "tailor-made-tours", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function TailorMadePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, settings] = await Promise.all([getPage("tailor-made-tours", locale), getSiteSettings(locale)]);
  return (
    <>
      {data && hasActiveHero(data.sections) ? <PageRenderer sections={data.sections} settings={settings} part="hero" /> : <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} banner="tailor-made-tours" />}
      <section className="py-14 sm:py-20">
        <div className="container-page max-w-5xl">
          {data?.page.content && <Markdown content={data.page.content} className="mb-10" />}
          <TailorMadeForm />
        </div>
      </section>
      {data && <PageRenderer sections={data.sections} settings={settings} part="body" />}
    </>
  );
}
