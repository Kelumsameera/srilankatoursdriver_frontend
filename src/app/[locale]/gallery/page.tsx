import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { GalleryGrid } from "@/components/gallery/GalleryGrid";
import { CategoryFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("gallery", locale);
  return buildMetadata({ locale, path: "/gallery", routeKey: "gallery", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function GalleryPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const category = param(sp, "category");
  const page = pageParam(sp);
  const [data, categories, list, settings, t, tg] = await Promise.all([
    getPage("gallery", locale),
    getCategories("gallery", locale),
    getList("gallery", { locale, page, limit: 48, category }),
    getSiteSettings(locale),
    getTranslations("common"),
    getTranslations("gallery"),
  ]);
  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-14 sm:py-20">
        <div className="container-page">
          <CategoryFilter basePath="/gallery" categories={categories ?? []} active={category} />
          {list?.items.length ? (
            <GalleryGrid
              items={list.items}
              filters
              labels={{ close: t("close"), previous: t("previous"), next: t("next"), all: t("all"), photos: tg("photos"), videos: tg("videos") }}
            />
          ) : (
            <EmptyState text={t("noResults")} />
          )}
          {list && <Pagination meta={list.meta} basePath="/gallery" query={{ category }} />}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
