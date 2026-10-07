import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getCategories, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { BlogCard } from "@/components/cards/cards";
import { CategoryFilter, Pagination, pageParam, param, type SearchParams } from "@/components/site/listing";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("blog", locale);
  return buildMetadata({ locale, path: "/blog", routeKey: "blog", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function BlogPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const category = param(sp, "category");
  const page = pageParam(sp);
  const [data, categories, list, settings, t] = await Promise.all([
    getPage("blog", locale),
    getCategories("blog", locale),
    getList("blog", { locale, page, limit: 9, category }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);
  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-16 sm:py-20">
        <div className="container-page">
          <CategoryFilter basePath="/blog" categories={categories ?? []} active={category} />
          {list?.items.length ? (
            <div className="grid gap-x-8 gap-y-14 md:grid-cols-2 lg:grid-cols-3">
              {list.items.map((p) => (
                <BlogCard key={p._id} post={p} />
              ))}
            </div>
          ) : (
            <EmptyState text={t("noResults")} />
          )}
          {list && <Pagination meta={list.meta} basePath="/blog" query={{ category }} />}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
