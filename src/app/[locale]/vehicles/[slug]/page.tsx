import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Briefcase, CarFront, Check, Snowflake, Users } from "lucide-react";
import { getDetail, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { formatPrice, whatsappLink } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { ButtonLink, buttonClass } from "@/components/ui/Button";
import { Markdown } from "@/components/ui/Markdown";
import { SocialIcons } from "@/components/ui/icons";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { Breadcrumbs } from "@/components/site/Breadcrumbs";
import { VehicleGallery } from "@/components/site/VehicleGallery";
import { TrackView } from "@/components/site/Analytics";

// /en/vehicles/toyota-prius -> Next.js gives us the locale and the slug from the URL
type Props = { params: Promise<{ locale: string; slug: string }> };

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale, slug } = await params;
  const data = await getDetail("vehicles", slug, locale);
  if (!data) return {};
  const vehicle = data.item;
  return buildMetadata({
    locale,
    path: `/vehicles/${vehicle.slug}`,
    title: vehicle.name,
    description: vehicle.description,
    image: vehicle.images?.[0],
    seo: vehicle.seo,
  });
}

// Small gold uppercase heading with a line after it ("OVERVIEW ———")
function SectionLabel({ label }: { label: string }) {
  return (
    <div className="mb-6 flex items-center gap-6">
      <h2 className="whitespace-nowrap font-sans text-caption font-bold uppercase tracking-[0.4em] text-gold-600">{label}</h2>
      <div className="h-px flex-1 bg-forest-950/10" aria-hidden />
    </div>
  );
}

// Vehicle overview: photos, specs, features and daily rate (all from Admin → Vehicles).
// This is a server component (no "use client"): the vehicle is fetched on the server.
export default async function VehicleDetailPage({ params }: Props) {
  const { locale, slug } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);

  const [data, listingPage, settings, t, tCommon] = await Promise.all([
    getDetail("vehicles", slug, locale),
    // The /vehicles CMS page, only for its title in the breadcrumbs
    getPage("vehicles", locale),
    getSiteSettings(locale),
    getTranslations("vehicle"),
    getTranslations("common"),
  ]);
  // Unknown or unpublished slug: notFound() shows the site's 404 page with a real 404 status
  if (!data) notFound();

  const vehicle = data.item;
  const rate = formatPrice(vehicle.dailyRate, vehicle.currency, locale);
  const images = vehicle.images ?? [];
  const whatsappMessage = `${settings?.whatsappMessage ?? ""} ${vehicle.name}`.trim();
  // "Toyota Prius" -> "Toyota" + emphasised "Prius", as on the original site
  const nameWords = vehicle.name.trim().split(/\s+/);
  const [namePrefix, nameLast] = nameWords.length > 1 ? [nameWords.slice(0, -1).join(" "), nameWords[nameWords.length - 1]] : [null, vehicle.name];

  // Only the specs this vehicle has
  const specs = [
    { icon: CarFront, label: t("typeLabel"), value: vehicle.type },
    { icon: Users, label: t("passengers"), value: vehicle.seats ? tCommon("seats", { count: vehicle.seats }) : undefined },
    { icon: Briefcase, label: t("luggage"), value: vehicle.luggageCapacity ? tCommon("bags", { count: vehicle.luggageCapacity }) : undefined },
    { icon: Snowflake, label: t("comfort"), value: vehicle.airConditioning ? tCommon("airConditioned") : undefined },
  ].filter((spec) => spec.value);

  return (
    <div className="bg-sand-50">
      <TrackView event="view_vehicle" itemId={vehicle.slug} />

      {/* HERO: type pill and the two-part name */}
      <section className="relative isolate flex min-h-[26rem] items-end overflow-hidden bg-forest-950 text-white sm:min-h-[32rem]">
        <CmsImage media={images[0]} alt="" preload wrapperClassName="absolute inset-0 -z-10 opacity-75" className="animate-ken-burns" />
        <div className="absolute inset-0 -z-10 bg-gradient-to-b from-forest-950/10 via-forest-950/35 to-forest-950/95" />
        <div className="container-page w-full pb-24 pt-36">
          <Breadcrumbs
            locale={locale}
            items={[
              { label: tCommon("home"), href: "/" },
              { label: listingPage?.page.title ?? "", href: "/vehicles" },
              { label: vehicle.name },
            ]}
          />
          {vehicle.type && (
            <span className="mb-4 inline-flex rounded-full border border-gold-500/40 bg-gold-500/15 px-3 py-1 text-caption font-bold uppercase tracking-[0.2em] text-gold-400 backdrop-blur">
              {vehicle.type}
            </span>
          )}
          <h1 className="animate-fade-up font-display text-display leading-[0.95] tracking-tight">
            {namePrefix && <span className="block font-light text-white/90">{namePrefix}</span>}
            <em className="font-semibold text-gold-400">{nameLast}</em>
          </h1>
        </div>
      </section>

      <div className="container-page relative z-10 -mt-16 grid grid-cols-1 items-start gap-12 pb-20 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-12">
          {/* GALLERY */}
          <VehicleGallery images={images} name={vehicle.name} labels={{ previous: tCommon("previous"), next: tCommon("next") }} />

          {/* OVERVIEW */}
          {vehicle.description && (
            <section>
              <SectionLabel label={t("overview")} />
              <div className="rounded-e-2xl border-s-4 border-gold-500 bg-white p-5 shadow-sm sm:p-8">
                <Markdown content={vehicle.description} className="text-base leading-relaxed sm:text-lg" />
              </div>
            </section>
          )}

          {/* SPECS */}
          {specs.length > 0 && (
            <dl className="grid grid-cols-2 gap-4 md:grid-cols-4">
              {specs.map((spec) => (
                <div key={spec.label} className="rounded-2xl border border-forest-950/5 bg-white p-6 text-center shadow-sm">
                  <spec.icon className="mx-auto mb-3 h-5 w-5 text-gold-600" aria-hidden />
                  <dt className="mb-1 text-caption font-bold uppercase tracking-widest text-muted">{spec.label}</dt>
                  <dd className="font-display text-lg text-forest-900">{spec.value}</dd>
                </div>
              ))}
            </dl>
          )}

          {/* FEATURES */}
          {vehicle.features?.length ? (
            <section className="rounded-2xl border border-forest-950/5 bg-white p-5 shadow-sm sm:p-8">
              <SectionLabel label={t("features")} />
              <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {vehicle.features.map((feature, index) => (
                  <li key={`${index}-${feature}`} className="flex items-start gap-3 text-sm text-ink">
                    <Check className="mt-0.5 h-4 w-4 shrink-0 text-forest-600" aria-hidden /> {feature}
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
        </div>

        {/* RATE BOX: sticky next to the content on desktop, below it on phones */}
        <aside className="lg:sticky lg:top-28">
          <div className="relative overflow-hidden rounded-3xl border border-forest-950/5 bg-white p-6 text-center shadow-card sm:p-10" data-testid="vehicle-booking-card">
            <div className="absolute inset-x-0 top-0 h-1 bg-gold-500" aria-hidden />
            {rate ? (
              <>
                <span className="mb-3 block text-caption font-bold uppercase tracking-widest text-muted">{t("startsFrom")}</span>
                <p className="font-display text-5xl italic leading-none tracking-tight text-forest-900">{rate}</p>
                <p className="mt-2 text-sm text-muted">{t("perDay")}</p>
              </>
            ) : (
              <p className="font-display text-2xl text-forest-800">{tCommon("priceOnRequest")}</p>
            )}
            {vehicle.availability && vehicle.availability !== "available" && <p className="mt-3 text-sm font-medium text-earth-700">{t(vehicle.availability)}</p>}
            <div className="mt-8 flex flex-col gap-3">
              <ButtonLink href={`/booking?type=vehicle&vehicle=${vehicle._id}`} size="lg" className="w-full">
                {t("book")}
              </ButtonLink>
              {settings?.whatsapp && (
                <a href={whatsappLink(settings.whatsapp, whatsappMessage)} target="_blank" rel="noopener noreferrer" className={buttonClass("whatsapp", "lg", "w-full")}>
                  <SocialIcons.whatsapp className="h-5 w-5" /> {tCommon("chatOnWhatsapp")}
                </a>
              )}
            </div>
            <p className="mt-6 text-caption uppercase tracking-tight text-muted">{t("disclaimer")}</p>
          </div>
        </aside>
      </div>

      {/* RELATED VEHICLES */}
      {data.related.length > 0 && (
        <section className="border-t border-forest-950/5 bg-white py-section-sm">
          <div className="container-page">
            <h2 className="mb-10 text-h2 text-forest-900">{t("related")}</h2>
            <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
              {data.related.map((relatedVehicle) => (
                <VehicleCard key={relatedVehicle._id} vehicle={relatedVehicle} />
              ))}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
