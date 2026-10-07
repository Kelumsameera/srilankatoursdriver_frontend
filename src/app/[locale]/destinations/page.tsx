import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { DestinationCard } from "@/components/cards/cards";
import { CategoryFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("destinations", locale);
  return buildMetadata({ locale, path: "/destinations", routeKey: "destinations", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function DestinationsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const category = param(sp, "category");
  const page = pageParam(sp);
  const [data, categories, list, settings, t] = await Promise.all([
    getPage("destinations", locale),
    getCategories("destination", locale),
    getList("destinations", { locale, page, limit: 24, category }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);
  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <CategoryFilter basePath="/destinations" categories={categories ?? []} active={category} />
          {list?.items.length ? (
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4" data-testid="destination-list">
              {list.items.map((d) => (
                <DestinationCard key={d._id} destination={d} />
              ))}
            </div>
          ) : (
            <EmptyState text={t("noResults")} />
          )}
          {list && <Pagination meta={list.meta} basePath="/destinations" query={{ category }} />}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
