import type { Metadata } from "next";
import { setRequestLocale } from "next-intl/server";
import { getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { PageHero } from "@/components/ui/misc";
import { Markdown } from "@/components/ui/Markdown";
import { TailorMadeForm } from "@/components/forms/TailorMadeForm";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("tailor-made-tours", locale);
  return buildMetadata({ locale, path: "/tailor-made-tours", routeKey: "tailor-made-tours", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function TailorMadePage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, destinations, vehicles, settings] = await Promise.all([
    getPage("tailor-made-tours", locale),
    getList("destinations", { locale, limit: 60 }),
    getList("vehicles", { locale, limit: 60 }),
    getSiteSettings(locale),
  ]);
  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-14 sm:py-20">
        <div className="container-page max-w-5xl">
          {data?.page.content && <Markdown content={data.page.content} className="mb-10" />}
          <TailorMadeForm
            destinations={(destinations?.items ?? []).map((d) => ({ id: d._id, label: d.name }))}
            vehicles={(vehicles?.items ?? []).map((v) => ({ id: v._id, label: v.name }))}
            defaultCurrency={settings?.currency}
          />
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
