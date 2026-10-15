import type { ReactNode } from "react";
import { getTranslations } from "next-intl/server";
import { Mail, Phone } from "lucide-react";
import type { SiteSettings } from "@/types/cms";
import { telLink, whatsappLink } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { SocialIcons } from "@/components/ui/icons";

const NETWORK_LABEL: Record<string, string> = {
  facebook: "Facebook",
  instagram: "Instagram",
  youtube: "YouTube",
  tiktok: "TikTok",
  tripadvisor: "Tripadvisor",
  twitter: "X",
  linkedin: "LinkedIn",
  pinterest: "Pinterest",
};

/**
 * Shown above the footer on every page: partner / accreditation logos and social profiles
 * (Admin → Social Media & Partners), then a "plan your trip" contact band (Admin → Site Settings).
 * Each part hides itself when it has no data.
 */
export async function TrustBar({ settings }: { settings: SiteSettings }) {
  const t = await getTranslations("trust");
  const partners = (settings.partners ?? []).filter((p) => p.name);
  const social = Object.entries(settings.social ?? {}).filter(([n, url]) => !!url && n in SocialIcons) as [keyof typeof SocialIcons, string][];
  const contacts = [
    settings.phone && { href: telLink(settings.phone), icon: <Phone className="h-6 w-6" />, label: settings.phone, sub: t("callUs"), external: false },
    settings.email && { href: `mailto:${settings.email}`, icon: <Mail className="h-6 w-6" />, label: settings.email, sub: t("emailUs"), external: false },
    settings.whatsapp && {
      href: whatsappLink(settings.whatsapp, settings.whatsappMessage),
      icon: <SocialIcons.whatsapp className="h-6 w-6" />,
      label: "WhatsApp",
      sub: t("whatsappDesc"),
      external: true,
    },
  ].filter(Boolean) as { href: string; icon: ReactNode; label: string; sub: string; external: boolean }[];

  return (
    <>
      {(partners.length > 0 || social.length > 0) && (
        <section className="bg-white" aria-labelledby="trust-heading" data-testid="trust-bar">
          <div className="h-1 w-full bg-gradient-to-r from-forest-600 via-gold-500 to-forest-600" aria-hidden />
          <div className="container-page py-7 sm:py-20">
            <div className="mb-4 text-center sm:mb-12">
              <p className="eyebrow mb-2 max-sm:text-[0.6rem] sm:mb-3">{t("accredited")}</p>
              <h2 id="trust-heading" className="text-2xl text-forest-900 sm:text-4xl">
                {t("trustedBy")}
              </h2>
              <div className="mx-auto mt-3 h-0.5 w-12 sm:mt-5 sm:h-1 sm:w-16 rounded-full bg-gold-500" aria-hidden />
            </div>

            {partners.length > 0 && (
              <ul className="mb-5 grid grid-cols-3 gap-2 sm:mb-14 sm:gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {partners.map((p) => {
                  const inner = p.logo?.url ? (
                    <CmsImage
                      media={p.logo}
                      alt={p.logo.alt || p.name}
                      sizes="160px"
                      wrapperClassName="h-9 w-full bg-transparent sm:h-14"
                      className="!object-contain opacity-60 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  ) : (
                    <span className="font-display text-xs text-forest-800 sm:text-lg">{p.name}</span>
                  );
                  const cls =
                    "group flex h-16 items-center justify-center rounded-xl border border-sand-200 bg-sand-50 p-2 sm:h-28 sm:rounded-3xl sm:p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold-400 hover:bg-white hover:shadow-card";
                  return (
                    <li key={p.name}>
                      {p.url ? (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className={cls} aria-label={p.name} title={p.name}>
                          {inner}
                        </a>
                      ) : (
                        <div className={cls} title={p.name}>
                          {inner}
                        </div>
                      )}
                    </li>
                  );
                })}
              </ul>
            )}

            {social.length > 0 && (
              <>
                <div className="mb-4 flex items-center gap-3 sm:mb-8 sm:gap-6" aria-hidden>
                  <div className="h-px flex-1 bg-sand-200" />
                  <span className="font-display text-base sm:text-xl italic text-earth-500">{t("stayConnected")}</span>
                  <div className="h-px flex-1 bg-sand-200" />
                </div>
                <ul className="flex flex-wrap items-center justify-center gap-3" aria-label={t("followUs")}>
                  {social.map(([network, url]) => {
                    const Icon = SocialIcons[network];
                    return (
                      <li key={network}>
                        <a
                          href={url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="group flex items-center gap-3 rounded-2xl border border-sand-200 bg-white px-5 py-3 text-sm font-semibold text-forest-900 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:border-forest-800 hover:bg-forest-800 hover:text-white"
                        >
                          <Icon className="h-5 w-5 text-forest-600 transition-colors group-hover:text-gold-400" />
                          {NETWORK_LABEL[network] ?? network}
                        </a>
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </div>
        </section>
      )}

      {contacts.length > 0 && (
        <section className="relative overflow-hidden bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 py-10 text-white sm:px-4 sm:py-14" aria-labelledby="plan-heading">
          <div className="pointer-events-none absolute -start-24 -top-24 h-96 w-96 rounded-full bg-gold-500/15 blur-[100px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -end-24 h-96 w-96 rounded-full bg-forest-500/25 blur-[100px]" aria-hidden />
          <div className="container-page relative text-center">
            <p className="eyebrow mb-5 text-gold-400 sm:mb-3">{t("available247")}</p>
            <h2 id="plan-heading" className="mx-auto max-w-3xl text-3xl leading-tight sm:text-4xl lg:text-5xl">
              {t("planDream")}
            </h2>
            <p className="mx-auto mb-6 mt-3 max-w-2xl text-sm sm:mb-7 sm:mt-4 sm:text-base text-white/75">{t("planDesc")}</p>
            <ul className={`mx-auto grid max-w-5xl gap-3 sm:gap-5 ${contacts.length === 3 ? "lg:grid-cols-3" : contacts.length === 2 ? "md:grid-cols-2" : ""}`}>
              {contacts.map((c) => (
                <li key={c.sub}>
                  <a
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noopener noreferrer" : undefined}
                    className="group grid h-full grid-cols-[2.5rem_minmax(0,1fr)] items-center gap-x-3 gap-y-1 rounded-2xl border border-white/15 bg-white/5 p-4 text-start backdrop-blur sm:flex sm:flex-col sm:gap-3 sm:rounded-2xl sm:p-5 sm:text-center transition-all duration-500 hover:-translate-y-2 hover:bg-white hover:text-forest-900"
                  >
                    <span className="row-span-2 flex h-10 w-10 items-center justify-center sm:h-11 sm:w-11 rounded-full bg-white/10 text-gold-400 transition-colors duration-500 group-hover:bg-forest-800">
                      {c.icon}
                    </span>
                    <span className="min-w-0 text-sm font-semibold leading-tight [overflow-wrap:anywhere] sm:text-base">
                      {/* Long e-mail addresses wrap after the "@" instead of mid-word. */}
                      {c.label.includes("@") ? (
                        <>
                          {c.label.split("@")[0]}@<wbr />
                          {c.label.split("@").slice(1).join("@")}
                        </>
                      ) : (
                        c.label
                      )}
                    </span>
                    <span className="col-start-2 text-[0.65rem] font-semibold uppercase tracking-[0.1em] text-white/60 sm:text-xs sm:tracking-[0.2em] group-hover:text-muted">{c.sub}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[0.65rem] font-medium sm:mt-6 sm:text-xs uppercase tracking-[0.25em] text-white/50">{t("tagline")}</p>
          </div>
        </section>
      )}
    </>
  );
}
