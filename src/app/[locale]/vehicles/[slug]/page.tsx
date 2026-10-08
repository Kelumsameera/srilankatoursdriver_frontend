import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getLocale, getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, CarFront, Check, Snowflake, Users } from "lucide-react";
import { getDetail, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { SocialIcons } from "@/components/ui/icons";
import { VehicleCard } from "@/components/cards/cards";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { VehicleGallery } from "@/components/site/VehicleGallery";

type Props = { params: Promise<{ locale: string; slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("vehicles", slug, locale);
  if (!data) return {};
  const v = data.item;
  return buildMetadata({ locale, path: `/vehicles/${v.slug}`, title: v.name, description: v.description, image: v.images?.[0], seo: v.seo });
}

function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-6">
      <h2 className="whitespace-nowrap font-sans text-[0.68rem] font-bold uppercase tracking-[0.4em] text-gold-600">{label}</h2>
      <div className="h-px flex-1 bg-forest-950/10" aria-hidden />
    </div>
  );
}

/** Vehicle overview: photos, specs, features and daily rate (all from Admin → Vehicles). */
export default async function VehicleDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  setRequestLocale(locale);
  const [data, listing, settings, t, tc] = await Promise.all([
    getDetail("vehicles", slug, locale),
    getPage("vehicles", locale),
    getSiteSettings(locale),
    getTranslations("vehicle"),
    getTranslations("common"),
  ]);
  if (!data) notFound();
  const v = data.item;
  const rate = formatPrice(v.dailyRate, v.currency, await getLocale());
  const images = v.images ?? [];
  // "Toyota Prius" → "Toyota" + emphasised "Prius", as on the original site.
  const words = v.name.trim().split(/\s+/);
  const [namePrefix, nameLast] = words.length > 1 ? [words.slice(0, -1).join(" "), words[words.length - 1]] : [null, v.name];

  const specs = [
    { icon: CarFront, label: t("typeLabel"), value: v.type },
    { icon: Users, label: t("passengers"), value: v.seats ? tc("seats", { count: v.seats }) : undefined },
    { icon: Briefcase, label: t("luggage"), value: v.luggageCapacity ? tc("bags", { count: v.luggageCapacity }) : undefined },
    { icon: Snowflake, label: t("comfort"), value: v.airConditioning ? tc("airConditioned") : undefined },
  ].filter((s) => s.value);

  return (
    <div className="bg-sand-50">
      <section className="relative isolate flex min-h-[26rem] items-end overflow-hidden bg-forest-950 text-white sm:min-h-[32rem]">
        <CmsImage media={images[0]} alt="" priority wrapperClassName="absolute inset-0 -z-10 opacity-75" className="animate-ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/10 via-forest-950/35 to-forest-950/95" />
        <div className="container-page w-full pb-24 pt-36">
          <Breadcrumbs locale={locale} items={[{ label: tc("home"), href: "/" }, { label: listing?.page.title ?? "", href: "/vehicles" }, { label: v.name }]} />
          {v.type && (
            <span className="mb-4 inline-flex rounded-full border border-gold-500/40 bg-gold-500/15 px-3 py-1 text-[0.6rem] font-bold uppercase tracking-[0.2em] text-gold-400 backdrop-blur">
              {v.type}
            </span>
          )}
          <h1 className="animate-fade-up font-display text-5xl leading-[0.95] tracking-tight sm:text-7xl lg:text-8xl">
            {namePrefix && <span className="block font-light text-white/90">{namePrefix}</span>}
            <em className="font-semibold text-gold-400">{nameLast}</em>
          </h1>
        </div>
      </section>

      <div className="container-page relative z-10 -mt-16 grid items-start gap-12 pb-20 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-12">
          <VehicleGallery images={images} name={v.name} labels={{ previous: tc("previous"), next: tc("next") }} />

          {v.description && (
            <section>
              <SectionLabel label={t("overview")} />
              <div className="rounded-e-2xl border-s-4 border-gold-500 bg-white p-8 shadow-sm">
                <Markdown content={v.description} className="text-lg leading-relaxed" />
              </div>
            </section>
          )}

          {specs.length > 0 && (
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {specs.map((s) => (
                <div key={s.label} className="rounded-2xl border border-forest-950/5 bg-white p-6 text-center shadow-sm">
                  <s.icon className="mx-auto mb-3 h-5 w-5 text-gold-600" aria-hidden />
                  <dt className="mb-1 text-[0.6rem] font-bold uppercase tracking-widest text-muted">{s.label}</dt>
                  <dd className="font-display text-lg text-forest-900">{s.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {v.features?.length ? (
            <section className="rounded-2xl border border-forest-950/5 bg-white p-8 shadow-sm">
              <SectionLabel label={t("features")} />
              <ul className="grid gap-3 sm:grid-cols-2">
                {v.features.map((f, i) => (
                  <li key={`${i}-${f}`} className="flex items-start gap-3 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden /> {f}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        <aside className="lg:sticky lg:top-28">
          <div className="relative overflow-hidden rounded-3xl border border-forest-950/5 bg-white p-8 text-center shadow-card sm:p-10" data-testid="vehicle-booking-card">
            <div className="absolute inset-x-0 top-0 h-1 bg-gold-500" aria-hidden />
            {rate ? (
              <>
                <span className="mb-3 block text-[0.65rem] font-bold uppercase tracking-widest text-muted">{t("startsFrom")}</span>
                <p className="font-display text-5xl italic leading-none tracking-tight text-forest-900">{rate}</p>
                <p className="mt-2 text-sm text-muted">{t("perDay")}</p>
              </>
            ) : (
              <p className="font-display text-2xl text-forest-800">{tc("priceOnRequest")}</p>
            )}
            {v.availability && v.availability !== "available" && <p className="mt-3 text-sm font-medium text-earth-700">{t(v.availability)}</p>}
            <div className="mt-8 flex flex-col gap-3">
              <ButtonLink href={`/booking?type=vehicle&vehicle=${v._id}`} size="lg" className="w-full">
                {t("book")}
              </ButtonLink>
              {settings?.whatsapp && (
                <a href={whatsappLink(settings.whatsapp, `${settings.whatsappMessage ?? ""} ${v.name}`.trim())} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "lg", "w-full")}>
                  <SocialIcons.whatsapp className="h-5 w-5" /> {tc("chatOnWhatsapp")}
                </a>
              )}
            </div>
            <p className="mt-6 text-[0.65rem] uppercase tracking-tight text-muted">{t("disclaimer")}</p>
          </div>
        </aside>
      </div>

      {data.related.length > 0 && (
        <section className="border-t border-forest-950/5 bg-white py-16">
          <div className="container-page">
            <h2 className="mb-10 text-3xl text-forest-900">{t("related")}</h2>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
              {data.related.map((r) => (
                <VehicleCard key={r._id} vehicle={r} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
