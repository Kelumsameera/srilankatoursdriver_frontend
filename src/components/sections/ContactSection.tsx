import type { ComponentType } from "react";
import { Clock, Mail, MapPin, Phone } from "lucide-react";
import { telLink, whatsappLink } from "@/lib/utils";
import { Section } from "@/components/ui/misc";
import { SocialIcons } from "@/components/ui/icons";
import { Heading, sectionTheme, type SectionProps } from "./sectionParts";

// "contact" section: phone, WhatsApp, e-mail, opening hours and address from the site settings, as small cards
export function ContactSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  const settings = ctx.settings;
  if (!settings) return null;

  return (
    <Section theme={theme}>
      <Heading section={section} light={light} withAction={false} ctx={ctx} />
      <ul className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {/* Only the details that are filled in settings; the ones with a link open the phone, WhatsApp, mail or map */}
        {[
          settings.phone && { icon: Phone, label: settings.phone, href: telLink(settings.phone) },
          settings.whatsapp && { icon: SocialIcons.whatsapp, label: settings.whatsapp, href: whatsappLink(settings.whatsapp, settings.whatsappMessage) },
          settings.email && { icon: Mail, label: settings.email, href: `mailto:${settings.email}` },
          settings.businessHours && { icon: Clock, label: settings.businessHours },
          settings.address && { icon: MapPin, label: settings.address, href: settings.googleMapsUrl },
        ]
          .filter(Boolean)
          .map((row, i) => {
            const r = row as { icon: ComponentType<{ className?: string }>; label: string; href?: string };
            const Icon = r.icon;
            const inner = (
              <>
                <Icon className="h-5 w-5 shrink-0 text-gold-600" />
                <span className="min-w-0 break-words [overflow-wrap:anywhere]">{r.label}</span>
              </>
            );
            return (
              <li key={i} className="rounded-2xl bg-white p-5 shadow-card">
                {r.href ? (
                  <a href={r.href} className="flex items-start gap-3 text-forest-900 hover:text-forest-600" target={r.href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">
                    {inner}
                  </a>
                ) : (
                  <p className="flex items-start gap-3 text-forest-900">{inner}</p>
                )}
              </li>
            );
          })}
      </ul>
    </Section>
  );
}
