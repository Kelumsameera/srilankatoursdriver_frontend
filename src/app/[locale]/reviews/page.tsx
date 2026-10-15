import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { ReviewCard } from "@/components/cards/cards";
import { ReviewForm } from "@/components/forms/ReviewForm";
import { Pagination, pageParam, type SearchParams } from "@/components/site/listing";
import { PageRenderer, hasActiveHero } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("reviews", locale);
  return buildMetadata({ locale, path: "/reviews", routeKey: "reviews", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

/** Genuine, admin-approved guest reviews only. */
export default async function ReviewsPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const page = pageParam(await searchParams);
  const [data, list, settings, t] = await Promise.all([
    getPage("reviews", locale),
    getList("reviews", { locale, page, limit: 12 }),
    getSiteSettings(locale),
    getTranslations("common"),
  ]);
  return (
    <>
      {data && hasActiveHero(data.sections) ? <PageRenderer sections={data.sections} settings={settings} part="hero" /> : <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />}
      <section className="py-14 sm:py-20">
        <div className="container-page">
          {list?.items.length ? (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {list.items.map((r) => (
                <ReviewCard key={r._id} review={r} />
              ))}
            </div>
          ) : (
            <EmptyState text={t("noResults")} />
          )}
          {list && <Pagination meta={list.meta} basePath="/reviews" />}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections} settings={settings} part="body" />}
      <section className="bg-sand-100 py-16">
        <div className="container-page max-w-3xl">
          <ReviewForm />
        </div>
      </section>
    </>
  );
}
