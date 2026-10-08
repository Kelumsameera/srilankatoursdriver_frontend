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
          <div className="container-page py-16 sm:py-20">
            <div className="mb-12 text-center">
              <p className="eyebrow mb-3">{t("accredited")}</p>
              <h2 id="trust-heading" className="text-3xl text-forest-900 sm:text-4xl">
                {t("trustedBy")}
              </h2>
              <div className="mx-auto mt-5 h-1 w-16 rounded-full bg-gold-500" aria-hidden />
            </div>

            {partners.length > 0 && (
              <ul className="mb-14 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
                {partners.map((p) => {
                  const inner = p.logo?.url ? (
                    <CmsImage
                      media={p.logo}
                      alt={p.logo.alt || p.name}
                      sizes="160px"
                      wrapperClassName="h-14 w-full bg-transparent"
                      className="!object-contain opacity-60 grayscale transition duration-500 group-hover:opacity-100 group-hover:grayscale-0"
                    />
                  ) : (
                    <span className="font-display text-lg text-forest-800">{p.name}</span>
                  );
                  const cls =
                    "group flex h-28 items-center justify-center rounded-3xl border border-sand-200 bg-sand-50 p-6 transition-all duration-500 hover:-translate-y-1 hover:border-gold-400 hover:bg-white hover:shadow-card";
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
                <div className="mb-8 flex items-center gap-6" aria-hidden>
                  <div className="h-px flex-1 bg-sand-200" />
                  <span className="font-display text-xl italic text-earth-500">{t("stayConnected")}</span>
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
        <section className="relative overflow-hidden bg-gradient-to-br from-forest-800 via-forest-900 to-forest-950 px-4 py-20 text-white sm:py-24" aria-labelledby="plan-heading">
          <div className="pointer-events-none absolute -start-24 -top-24 h-96 w-96 rounded-full bg-gold-500/15 blur-[100px]" aria-hidden />
          <div className="pointer-events-none absolute -bottom-24 -end-24 h-96 w-96 rounded-full bg-forest-500/25 blur-[100px]" aria-hidden />
          <div className="container-page relative text-center">
            <p className="eyebrow mb-5 text-gold-400">{t("available247")}</p>
            <h2 id="plan-heading" className="mx-auto max-w-3xl text-4xl leading-tight sm:text-6xl">
              {t("planDream")}
            </h2>
            <p className="mx-auto mb-12 mt-6 max-w-2xl text-lg text-white/75">{t("planDesc")}</p>
            <ul className={`mx-auto grid max-w-5xl gap-5 ${contacts.length === 3 ? "md:grid-cols-3" : contacts.length === 2 ? "md:grid-cols-2" : ""}`}>
              {contacts.map((c) => (
                <li key={c.sub}>
                  <a
                    href={c.href}
                    target={c.external ? "_blank" : undefined}
                    rel={c.external ? "noopener noreferrer" : undefined}
                    className="group flex h-full flex-col items-center gap-4 rounded-[2rem] border border-white/15 bg-white/5 p-8 backdrop-blur transition-all duration-500 hover:-translate-y-2 hover:bg-white hover:text-forest-900"
                  >
                    <span className="flex h-14 w-14 items-center justify-center rounded-full bg-white/10 text-gold-400 transition-colors duration-500 group-hover:bg-forest-800">
                      {c.icon}
                    </span>
                    <span className="break-all text-lg font-semibold leading-tight">{c.label}</span>
                    <span className="text-xs font-semibold uppercase tracking-[0.2em] text-white/60 group-hover:text-muted">{c.sub}</span>
                  </a>
                </li>
              ))}
            </ul>
            <p className="mt-12 text-xs font-medium uppercase tracking-[0.25em] text-white/50">{t("tagline")}</p>
          </div>
        </section>
      )}
    </>
  );
}
