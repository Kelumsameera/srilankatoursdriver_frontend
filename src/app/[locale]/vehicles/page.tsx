import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { VehicleCard } from "@/components/cards/cards";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("vehicles", locale);
  return buildMetadata({ locale, path: "/vehicles", routeKey: "vehicles", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function VehiclesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, list, settings, t] = await Promise.all([
    getPage("vehicles", locale),
    getList("vehicles", { locale, limit: 60 }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);
  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-16 sm:py-20">
        <div className="container-page">
          {list?.items.length ? (
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {list.items.map((v) => (
                <VehicleCard key={v._id} vehicle={v} />
              ))}
            </div>
          ) : (
            <EmptyState text={t("noResults")} />
          )}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
