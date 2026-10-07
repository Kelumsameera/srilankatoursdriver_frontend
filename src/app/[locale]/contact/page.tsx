import type { Metadata } from "next";
import type { ReactNode } from "react";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { Clock, ExternalLink, Mail, MapPin, Phone } from "lucide-react";
import { getPage, getSiteSettings } from "@/lib/api/server";
import { buildMetadata } from "@/lib/seo";
import { telLink, whatsappLink } from "@/lib/utils";
import { PageHero } from "@/components/ui/misc";
import { SocialIcons } from "@/components/ui/icons";
import { ContactForm } from "@/components/forms/ContactForm";
import { PageRenderer } from "@/components/sections/PageRenderer";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const data = await getPage("contact", locale);
  return buildMetadata({ locale, path: "/contact", routeKey: "contact", seo: data?.page.seo, title: data?.page.title, description: data?.page.subtitle, image: data?.page.heroImage });
}

/** Contact details all come from Admin → Site Settings. */
export default async function ContactPage({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const [data, settings, t, tc] = await Promise.all([getPage("contact", locale), getSiteSettings(locale), getTranslations("contact"), getTranslations("common")]);
  const rows = settings
    ? [
        settings.whatsapp && { icon: <SocialIcons.whatsapp className="h-5 w-5" />, label: tc("whatsapp"), value: settings.whatsapp, href: whatsappLink(settings.whatsapp, settings.whatsappMessage), testId: "contact-whatsapp" },
        settings.phone && { icon: <Phone className="h-5 w-5" />, label: tc("call"), value: settings.phone, href: telLink(settings.phone), testId: "contact-phone" },
        settings.email && { icon: <Mail className="h-5 w-5" />, label: tc("email"), value: settings.email, href: `mailto:${settings.email}`, testId: "contact-email" },
        settings.businessHours && { icon: <Clock className="h-5 w-5" />, label: t("hours"), value: settings.businessHours, testId: "contact-hours" },
        settings.address && { icon: <MapPin className="h-5 w-5" />, label: t("address"), value: settings.address, href: settings.googleMapsUrl, testId: "contact-address" },
      ].filter(Boolean)
    : [];

  return (
    <>
      <PageHero title={data?.page.title ?? ""} subtitle={data?.page.subtitle} image={data?.page.heroImage} />
      <section className="py-14 sm:py-20">
        <div className="container-page grid gap-10 lg:grid-cols-[380px_1fr]">
          <div className="space-y-4">
            {rows.map((row) => {
              const r = row as { icon: ReactNode; label: string; value: string; href?: string; testId: string };
              const body = (
                <>
                  <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-forest-50 text-forest-700">{r.icon}</span>
                  <span>
                    <span className="block text-xs uppercase tracking-wider text-muted">{r.label}</span>
                    <span className="block break-words font-medium text-forest-900" data-testid={r.testId}>
                      {r.value}
                    </span>
                  </span>
                </>
              );
              return r.href ? (
                <a key={r.testId} href={r.href} target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card transition-transform hover:-translate-y-0.5">
                  {body}
                </a>
              ) : (
                <div key={r.testId} className="flex items-center gap-4 rounded-2xl bg-white p-5 shadow-card">
                  {body}
                </div>
              );
            })}
            {settings?.googleMapsUrl && (
              <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 text-sm font-medium text-forest-700 hover:underline">
                {t("openMaps")} <ExternalLink className="h-4 w-4" />
              </a>
            )}
          </div>
          <div className="space-y-8">
            <ContactForm />
            {settings?.mapEmbedUrl && (
              <iframe
                src={settings.mapEmbedUrl}
                title={t("findUs")}
                className="h-80 w-full rounded-3xl border-0 shadow-card"
                loading="lazy"
                referrerPolicy="no-referrer-when-downgrade"
              />
            )}
          </div>
        </div>
      </section>
      {data && <PageRenderer sections={data.sections.filter((s) => s.type !== "hero")} settings={settings} />}
    </>
  );
}
