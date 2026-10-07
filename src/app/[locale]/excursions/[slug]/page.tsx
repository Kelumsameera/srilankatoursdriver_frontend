import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, MapPin, Tag } from "lucide-react";
import { getDetail, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { SocialIcons } from "@/components/ui/icons";
import { ExcursionCard } from "@/components/cards/cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { CheckList, DetailSection, FactList, MediaStrip } from "@/components/site/DetailBits";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("excursions", slug, locale);
  if (!data) return {};
  const e = data.item;
  return buildMetadata({ locale, path: `/excursions/${e.slug}`, title: e.title, description: e.shortDescription || e.description, image: e.heroMedia, seo: e.seo });
}

export default async function ExcursionDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [data, listing, settings, t, tc, tt] = await Promise.all([
    getDetail("excursions", slug, locale),
    getPage("excursions", locale),
    getSiteSettings(locale),
    getTranslations("excursion"),
    getTranslations("common"),
    getTranslations("tour"),
  ]);
  if (!data) notFound();
  const e = data.item;
  const price = formatPrice(e.price, e.currency, await getLocale());

  return (
    <>
      <section className="relative isolate overflow-hidden bg-forest-900 text-white">
        <CmsImage media={e.heroMedia} alt={e.heroMedia?.alt || e.title} priority wrapperClassName="absolute inset-0 -z-10" className="animate-ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-t from-forest-950 via-forest-950/55 to-forest-950/25" />
        <div className="container-page pb-14 pt-40 sm:pt-52">
          <Breadcrumbs locale={locale} items={[{ label: tc("home"), href: "/" }, { label: listing?.page.title ?? "", href: "/excursions" }, { label: e.title }]} />
          <h1 className="max-w-4xl text-4xl leading-tight sm:text-6xl">{e.title}</h1>
          {e.shortDescription && <p className="mt-5 max-w-3xl text-lg text-white/80">{e.shortDescription}</p>}
          <div className="mt-10 border-t border-white/15 pt-8">
            <FactList
              facts={[
                { icon: <Clock className="h-5 w-5" />, label: t("duration"), value: e.duration },
                { icon: <MapPin className="h-5 w-5" />, label: t("location"), value: e.location || e.destination?.name },
                { icon: <Tag className="h-5 w-5" />, label: tc("from"), value: price ?? e.priceNote ?? undefined },
              ]}
            />
          </div>
        </div>
      </section>
      <div className="container-page grid gap-12 py-14 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0">
          <DetailSection>
            <Markdown content={e.description} />
          </DetailSection>
          {e.highlights?.length ? (
            <DetailSection title={tt("highlights")}>
              <CheckList items={e.highlights} />
            </DetailSection>
          ) : null}
          {e.included?.length ? (
            <DetailSection title={t("included")}>
              <CheckList items={e.included} />
            </DetailSection>
          ) : null}
          {e.gallery?.length ? (
            <DetailSection>
              <MediaStrip items={e.gallery} label={e.title} />
            </DetailSection>
          ) : null}
        </div>
        <aside className="lg:sticky lg:top-28 lg:self-start">
          <div className="rounded-3xl bg-white p-7 shadow-card">
            <p className="font-display text-3xl text-forest-800">{price ?? (e.priceNote || tc("priceOnRequest"))}</p>
            <div className="mt-6 flex flex-col gap-3">
              <ButtonLink href={`/booking?type=excursion&excursion=${e._id}`} size="lg" className="w-full">
                {t("book")}
              </ButtonLink>
              {settings?.whatsapp && (
                <a href={whatsappLink(settings.whatsapp, `${settings.whatsappMessage ?? ""} ${e.title}`.trim())} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "lg", "w-full")}>
                  <SocialIcons.whatsapp className="h-5 w-5" /> {tc("chatOnWhatsapp")}
                </a>
              )}
            </div>
          </div>
        </aside>
      </div>
      {data.related.length > 0 && (
        <section className="bg-sand-100 py-16">
          <div className="container-page">
            <h2 className="mb-10 text-3xl text-forest-900">{t("related")}</h2>
            <div className="grid gap-7 sm:grid-cols-2 lg:grid-cols-3">
              {data.related.map((r) => (
                <ExcursionCard key={r._id} excursion={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </>
  );
}
