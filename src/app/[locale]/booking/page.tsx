import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, Mail, Phone } from "lucide-react";
import { getList, getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { telLink, whatsappLink } from "@/lib/utils";
import { PageHero } from "@/components/ui/misc";
import { SocialIcons } from "@/components/ui/icons";
import { BookingForm } from "@/components/forms/BookingForm";
import { param, type SearchParams } from "@/components/site/listing";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }>; searchParams: SearchParams };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("booking", locale);
  return buildMetadata({ locale, path: "/booking", routeKey: "booking", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

export default async function BookingPage({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const sp = await searchParams;
  const [data, tours, excursions, vehicles, settings, t] = await Promise.all([
    getPage("booking", locale),
    getList("tours", { locale, limit: 60 }),
    getList("excursions", { locale, limit: 60 }),
    getList("vehicles", { locale, limit: 60 }),
    getSiteSettings(locale),
    getTranslations("contact"),
  ]);

  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[1fr_340px]">
          <BookingForm
            tours={(tours?.items ?? []).map((x) => ({ id: x._id, label: x.title }))}
            excursions={(excursions?.items ?? []).map((x) => ({ id: x._id, label: x.title }))}
            vehicles={(vehicles?.items ?? []).map((x) => ({ id: x._id, label: x.name }))}
            initial={{ type: param(sp, "type"), tour: param(sp, "tour"), excursion: param(sp, "excursion"), vehicle: param(sp, "vehicle") }}
          />
          {settings && (
            <aside className="space-y-4 lg:sticky lg:top-28 lg:self-start">
              <div className="rounded-3xl bg-forest-800 p-7 text-white">
                <p className="font-display text-2xl">{t("getInTouch")}</p>
                <ul className="mt-5 space-y-4 text-sm">
                  {settings.whatsapp && (
                    <li>
                      <a href={whatsappLink(settings.whatsapp, settings.whatsappMessage)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-3 hover:text-gold-400">
                        <SocialIcons.whatsapp className="h-5 w-5 text-gold-400" /> {settings.whatsapp}
                      </a>
                    </li>
                  )}
                  {settings.phone && (
                    <li>
                      <a href={telLink(settings.phone)} className="flex items-center gap-3 hover:text-gold-400">
                        <Phone className="h-5 w-5 text-gold-400" /> {settings.phone}
                      </a>
                    </li>
                  )}
                  {settings.email && (
                    <li>
                      <a href={`mailto:${settings.email}`} className="flex items-center gap-3 break-all hover:text-gold-400">
                        <Mail className="h-5 w-5 shrink-0 text-gold-400" /> {settings.email}
                      </a>
                    </li>
                  )}
                  {settings.businessHours && (
                    <li className="flex items-center gap-3">
                      <Clock className="h-5 w-5 text-gold-400" /> {settings.businessHours}
                    </li>
                  )}
                </ul>
              </div>
            </aside>
          )}
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
