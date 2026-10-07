import { getTranslations } from "next-intl/server";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import type { Branding, Destination, SiteSettings, Tour } from "@/types/cms";
import { interpolate, telLink, whatsappLink } from "@/lib/utils";
import { CmsLink } from "@/components/ui/CmsLink";
import { SocialIcons } from "@/components/ui/icons";
import { Logo } from "./Logo";

interface Props {
  settings: SiteSettings;
  branding: Branding | null;
  tours: Tour[];
  destinations: Destination[];
}

/** Every piece of footer content is managed in Admin → Footer / Site Settings / Social Media. */
export async function SiteFooter({ settings, branding, tours, destinations }: Props) {
  const t = await getTranslations("footer");
  const f = settings.footer ?? {};
  const columns = (f.columns ?? []).filter((c) => c.enabled !== false);
  const social = Object.entries(settings.social ?? {}).filter(([, url]) => !!url) as [keyof typeof SocialIcons, string][];

  return (
    <footer className="relative overflow-hidden bg-forest-950 text-white/75">
      <div className="pointer-events-none absolute -end-32 -top-32 h-96 w-96 rounded-full bg-forest-600/20 blur-3xl" aria-hidden />
      <div className="container-page relative grid gap-12 py-16 sm:py-20 lg:grid-cols-12">
        <div className="lg:col-span-4">
          <CmsLink href="/" className="inline-block" ariaLabel={settings.siteName}>
            <Logo branding={branding} siteName={settings.siteName} tone="light" />
          </CmsLink>
          {f.description && <p className="mt-6 max-w-sm leading-relaxed">{f.description}</p>}
          {f.showSocial !== false && social.length > 0 && (
            <div className="mt-6">
              <p className="mb-3 text-sm font-medium text-white">{t("followUs")}</p>
              <ul className="flex flex-wrap gap-2">
                {social.map(([network, url]) => {
                  const Icon = SocialIcons[network];
                  return Icon ? (
                    <li key={network}>
                      <a
                        href={url}
                        target="_blank"
                        rel="noopener noreferrer"
                        aria-label={network}
                        className="flex h-10 w-10 items-center justify-center rounded-full border border-white/15 transition-colors hover:border-gold-500 hover:text-gold-400"
                      >
                        <Icon className="h-4 w-4" />
                      </a>
                    </li>
                  ) : null;
                })}
              </ul>
            </div>
          )}
        </div>

        <div className="grid gap-10 sm:grid-cols-2 lg:col-span-5 lg:grid-cols-2">
          {columns.map((col) => (
            <div key={col.title}>
              <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">{col.title}</h3>
              <ul className="space-y-2.5">
                {col.links.map((l) => (
                  <li key={`${l.label}-${l.url}`}>
                    <CmsLink href={l.url} className="transition-colors hover:text-white">
                      {l.label}
                    </CmsLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
          {f.showTourLinks !== false && tours.length > 0 && (
            <div>
              <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">{t("popularTours")}</h3>
              <ul className="space-y-2.5">
                {tours.map((tour) => (
                  <li key={tour._id}>
                    <CmsLink href={`/tours/${tour.slug}`} className="transition-colors hover:text-white">
                      {tour.title}
                    </CmsLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
          {f.showDestinationLinks !== false && destinations.length > 0 && (
            <div>
              <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">{t("destinations")}</h3>
              <ul className="grid grid-cols-2 gap-x-4 gap-y-2.5">
                {destinations.map((d) => (
                  <li key={d._id}>
                    <CmsLink href={`/destinations/${d.slug}`} className="transition-colors hover:text-white">
                      {d.name}
                    </CmsLink>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>

        <div className="lg:col-span-3">
          <h3 className="mb-4 font-sans text-sm font-semibold uppercase tracking-[0.18em] text-gold-400">{t("contact")}</h3>
          <ul className="space-y-4 text-sm">
            {settings.address && (
              <li className="flex gap-3">
                <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                {settings.googleMapsUrl ? (
                  <a href={settings.googleMapsUrl} target="_blank" rel="noopener noreferrer" className="hover:text-white">
                    {settings.address}
                  </a>
                ) : (
                  <span>{settings.address}</span>
                )}
              </li>
            )}
            {settings.phone && (
              <li className="flex gap-3">
                <Phone className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <a href={telLink(settings.phone)} className="hover:text-white" data-testid="footer-phone">
                  {settings.phone}
                </a>
              </li>
            )}
            {settings.whatsapp && (
              <li className="flex gap-3">
                <SocialIcons.whatsapp className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" />
                <a
                  href={whatsappLink(settings.whatsapp, settings.whatsappMessage)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                  data-testid="footer-whatsapp"
                >
                  {settings.whatsapp}
                </a>
              </li>
            )}
            {settings.email && (
              <li className="flex gap-3">
                <Mail className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <a href={`mailto:${settings.email}`} className="break-all hover:text-white" data-testid="footer-email">
                  {settings.email}
                </a>
              </li>
            )}
            {settings.businessHours && (
              <li className="flex gap-3">
                <Clock className="mt-0.5 h-4 w-4 shrink-0 text-gold-400" aria-hidden />
                <span>{settings.businessHours}</span>
              </li>
            )}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-page flex flex-col gap-4 py-6 text-xs text-white/55 sm:flex-row sm:items-center sm:justify-between">
          <p data-testid="footer-copyright">{interpolate(f.copyright) || `© ${new Date().getFullYear()} ${settings.businessName}`}</p>
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {f.privacyUrl && (
              <li>
                <CmsLink href={f.privacyUrl} className="hover:text-white">
                  {t("privacy")}
                </CmsLink>
              </li>
            )}
            {f.termsUrl && (
              <li>
                <CmsLink href={f.termsUrl} className="hover:text-white">
                  {t("terms")}
                </CmsLink>
              </li>
            )}
            {f.cookieUrl && (
              <li>
                <CmsLink href={f.cookieUrl} className="hover:text-white">
                  {t("cookies")}
                </CmsLink>
              </li>
            )}
          </ul>
        </div>
      </div>
    </footer>
  );
}
