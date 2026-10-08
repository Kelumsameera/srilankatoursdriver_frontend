import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getLanguages, getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { locales } from "@/i18n/routing";
import type { Vehicle } from "@/types/cms";
import { EmptyState, PageHero } from "@/components/ui/misc";
import { RotatingText } from "@/components/ui/RotatingText";
import { VehicleCard } from "@/components/cards/cards";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("vehicles", locale);
  return buildMetadata({ locale, path: "/vehicles", routeKey: "vehicles", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

/** Groups vehicles by their type (Car, Van, Bus …) in the order the admin sorted them. */
function groupByType(items: Vehicle[], fallback: string) {
  const groups = new Map<string, { label: string; items: Vehicle[] }>();
  for (const v of items) {
    const label = v.type?.trim() || fallback;
    const key = label.toLowerCase();
    if (!groups.has(key)) groups.set(key, { label, items: [] });
    groups.get(key)!.items.push(v);
  }
  return [...groups.values()];
}

export default async function VehiclesPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, list, settings, languages, t, tv] = await Promise.all([
    getPage("vehicles", locale),
    getList("vehicles", { locale, limit: 60 }),
    getSiteSettings(locale),
    getLanguages(),
    getTranslations("common"),
    getTranslations("vehicle"),
  ]);

  // "Drivers who speak English · Deutsch · 日本語 …" – the site's enabled languages, named in the visitor's language.
  const codes = languages?.filter((l) => l.enabled).map((l) => l.code) ?? [...locales];
  let spoken: string[] = codes;
  try {
    const names = new Intl.DisplayNames([locale], { type: "language" });
    spoken = codes.map((c) => names.of(c) ?? c);
  } catch {
    /* keep codes */
  }
  const groups = groupByType(list?.items ?? [], tv("otherType"));

  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage}>
        {spoken.length > 1 && (
          <p className="mt-4 text-sm tracking-wide text-white/70">
            {tv("fleetDesc")}{" "}
            <RotatingText items={spoken} className="font-semibold text-gold-400" />
          </p>
        )}
      </PageHero>
      <section className="bg-sand-50 py-16 sm:py-20">
        <div className="container-page space-y-20">
          {groups.length ? (
            groups.map((g) => (
              <div key={g.label} data-testid="vehicle-group">
                <div className="mb-10 flex items-center gap-5 text-[0.68rem] font-bold uppercase tracking-[0.3em] text-gold-600">
                  <h2 className="font-sans text-[0.68rem] font-bold uppercase tracking-[0.3em] text-gold-600">{g.label}</h2>
                  <div className="h-px flex-1 bg-forest-950/10" aria-hidden />
                  <span className="font-medium tracking-[0.2em] text-muted">{tv("fleetCount", { count: g.items.length })}</span>
                </div>
                <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
                  {g.items.map((v) => (
                    <VehicleCard key={v._id} vehicle={v} />
                  ))}
                </div>
              </div>
            ))
          ) : (
            <EmptyState text={t("noResults")} />
          )}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
