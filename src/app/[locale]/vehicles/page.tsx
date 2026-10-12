import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLanguages, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { locales } from "@/i18n/routing";
import type { Vehicle } from "@/types/cms";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { RotatingText } from "@/components/ui/RotatingText";
import { VehicleCard } from "@/components/cards/VehicleCard";
import { PageRenderer } from "@/components/sections/PageRenderer";

// /en/vehicles -> Next.js gives us the locale from the URL
type Props = { params: Promise<{ locale: string }> };

// generateMetadata is Next.js's way to set the <title> and SEO tags. It runs on the server before the page.
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const pageData = await getPage("vehicles", locale);
  return buildMetadata({
    locale,
    path: "/vehicles",
    routeKey: "vehicles",
    seo: pageData?.page.seo,
    title: pageData?.page.title,
    description: pageData?.page.subtitle,
    image: pageData?.page.heroImage,
  });
}

// Groups vehicles by their type (Car, Van, Bus …) in the order the admin sorted them
function groupByType(vehicles: Vehicle[], fallbackLabel: string) {
  const groups = new Map<string, { label: string; vehicles: Vehicle[] }>();
  for (const vehicle of vehicles) {
    const label = vehicle.type?.trim() || fallbackLabel;
    const key = label.toLowerCase();
    if (!groups.has(key)) groups.set(key, { label, vehicles: [] });
    groups.get(key)!.vehicles.push(vehicle);
  }
  return [...groups.values()];
}

// The site's enabled languages, named in the visitor's language ("English", "Deutsch", "日本語" …)
function spokenLanguageNames(codes: string[], locale: string) {
  try {
    const names = new Intl.DisplayNames([locale], { type: "language" });
    return codes.map((code) => names.of(code) ?? code);
  } catch {
    // Old browsers / unknown locale: show the codes instead
    return codes;
  }
}

// This is a server component (no "use client"): the data is fetched on the server,
// so Google sees the whole fleet in the HTML.
export default async function VehiclesPage({ params }: Props) {
  const { locale } = await params;
  // Tells next-intl which language this page is rendered in
  setRequestLocale(locale);

  const [pageData, vehicleList, settings, languages, tCommon, tVehicle] = await Promise.all([
    getPage("vehicles", locale),
    // The whole fleet in one request (API maximum 60), grouped by type below
    getList("vehicles", { locale, limit: 60 }),
    getSiteSettings(locale),
    getLanguages(),
    getTranslations("common"),
    getTranslations("vehicle"),
  ]);

  // "Drivers who speak English · Deutsch · 日本語 …"
  const languageCodes = languages?.filter((language) => language.enabled).map((language) => language.code) ?? [...locales];
  const spokenLanguages = spokenLanguageNames(languageCodes, locale);
  const groups = groupByType(vehicleList?.items ?? [], tVehicle("otherType"));

  return (
    <>
      {/* HERO with the rotating list of languages the drivers speak */}
      <PageHero title={pageData?.page.title ?? ""} subtitle={pageData?.page.subtitle} image={pageData?.page.heroImage} banner="vehicles">
        {spokenLanguages.length > 1 && (
          <p className="mt-4 text-sm tracking-wide text-white/70">
            {tVehicle("fleetDesc")} <RotatingText items={spokenLanguages} className="font-semibold text-gold-400" />
          </p>
        )}
      </PageHero>

      {/* FLEET: one group per vehicle type */}
      <section className="bg-sand-50 py-section">
        <div className="container-page space-y-20">
          {groups.length ? (
            groups.map((group) => (
              <div key={group.label} data-testid="vehicle-group">
                {/* GROUP HEADER: type name, line, number of vehicles */}
                <div className="mb-10 flex items-center gap-5 text-caption font-bold uppercase tracking-[0.3em] text-gold-600">
                  <h2 className="font-sans text-caption font-bold uppercase tracking-[0.3em] text-gold-600">{group.label}</h2>
                  <div className="h-px flex-1 bg-forest-950/10" aria-hidden />
                  <span className="font-medium tracking-[0.2em] text-muted">{tVehicle("fleetCount", { count: group.vehicles.length })}</span>
                </div>
                <div className="grid grid-cols-1 gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {group.vehicles.map((vehicle) => (
                    <VehicleCard key={vehicle._id} vehicle={vehicle} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState text={tCommon("noResults")} />
          )}
        </div>
      </section>

      {/* CMS SECTIONS: everything the admin added to the "vehicles" page, except its hero (shown above) */}
      {pageData && <PageRenderer sections={pageData.sections.filter((section) => section.type !== "hero")} settings={settings} />}
    </>
  );
}
