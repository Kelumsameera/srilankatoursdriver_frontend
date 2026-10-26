import { ArrowRight } from "lucide-react";
import type { MediaAsset, PageSection, SiteSettings } from "@/types/cms";
import { cn } from "@/lib/utils";
import { ButtonLink, type ButtonVariant } from "@/components/ui/Button";
import { CmsLink } from "@/components/ui/CmsLink";
import { SectionHeading } from "@/components/ui/misc";

// Shared by all CMS section components (HeroSection.tsx, WhyChooseUsSection.tsx …). PageRenderer builds the context once per page.

// Facts about the whole page that some sections need (worked out once in PageRenderer)
export interface SectionContext {
  settings: SiteSettings | null;
  pageTitle?: string;
  preview?: boolean;
  /** Ids of tours shown by category-filtered tour sections on this page. */
  categorisedTours?: Set<string>;
  /** The page's "Why travel with us" items – also shown as the hero's selling points. */
  highlights?: NonNullable<PageSection["items"]>;
  /** Real CMS photos from this page (destinations, tours) for decorative collages. */
  photos?: MediaAsset[];
  /** The page opens with a hero, so the highlights are shown in the trust row under it. */
  hasHero?: boolean;
  /** A real coastal/landscape photo from this page for the closing call to action. */
  ctaPhoto?: MediaAsset;
  /** Real TripAdvisor rating of the business (only when the TripAdvisor section returned one). */
  rating?: { value: number; count: number };
}

// What every section component receives
export interface SectionProps {
  section: PageSection;
  ctx: SectionContext;
}

// One item of a section's "items" list (a feature, a team member, a checklist line …)
export type SectionItem = NonNullable<PageSection["items"]>[number];

// The "forest" and "dark" themes have a dark background, so text and buttons switch to their light versions
export const isDark = (theme?: string) => theme === "forest" || theme === "dark";

// The theme the admin picked for the section, and whether it is a dark one
export function sectionTheme(section: PageSection) {
  const theme = section.settings?.theme ?? "light";
  return { theme, light: isDark(theme) };
}

// The records the API attached to the section (tours, reviews …). Empty list when there are none.
export function sectionData<T>(section: PageSection) {
  return Array.isArray(section.data) ? (section.data as T[]) : [];
}

/** Distinct photos (by URL), in order. */
export const distinctPhotos = (list: (MediaAsset | null | undefined)[], max: number) => {
  const seen = new Set<string>();
  return list
    .filter((m): m is MediaAsset => Boolean(m?.url && m.resourceType !== "video" && !seen.has(m.url) && seen.add(m.url)))
    .slice(0, max);
};

// The section's buttons from Admin → Pages. On a dark background the outline button becomes the light outline.
export function Buttons({ section, ctx, light }: { section: PageSection; ctx: SectionContext; light?: boolean }) {
  if (!section.buttons?.length) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {section.buttons
        .filter((b) => b.label && b.url)
        .map((b, i) => {
          let variant = (b.variant ?? "primary") as ButtonVariant;
          if (light && variant === "outline") variant = "outline-light";
          return (
            <ButtonLink
              key={`${b.label}-${i}`}
              href={b.url}
              variant={variant}
              newTab={b.openInNewTab}
              whatsapp={{ phone: ctx.settings?.whatsapp, message: ctx.settings?.whatsappMessage }}
            >
              {b.label}
            </ButtonLink>
          );
        })}
    </div>
  );
}

// Eyebrow, title and subtitle of a section. With buttons it is left-aligned and the buttons become text links on the right.
export function Heading({ section, light, withAction = true, ctx }: { section: PageSection; light?: boolean; withAction?: boolean; ctx: SectionContext }) {
  return (
    <SectionHeading
      eyebrow={section.eyebrow}
      title={section.title}
      subtitle={section.subtitle}
      badge={section.badge}
      light={light}
      align={withAction && section.buttons?.length ? "left" : "center"}
      action={withAction ? <HeadingLinks section={section} ctx={ctx} light={light} /> : undefined}
    />
  );
}

/** Section-heading actions as quiet text links ("View all destinations →"), as in the design.
 * The link is only 23px tall, so an invisible after: layer makes the tap area 44px+ without moving anything. */
export function HeadingLinks({ section, ctx, light }: { section: PageSection; ctx: SectionContext; light?: boolean }) {
  const links = (section.buttons ?? []).filter((b) => b.label && b.url);
  if (!links.length) return null;
  return (
    <div className="flex flex-wrap gap-x-6 gap-y-2">
      {links.map((b, i) => (
        <CmsLink
          key={`${b.label}-${i}`}
          href={b.url}
          newTab={b.openInNewTab}
          whatsapp={{ phone: ctx.settings?.whatsapp, message: ctx.settings?.whatsappMessage }}
          className={cn(
            "group/link relative inline-flex items-center gap-2 border-b pb-0.5 text-small font-semibold transition-colors after:absolute after:inset-x-0 after:-inset-y-3 after:content-['']",
            light ? "border-gold-400/60 text-white hover:text-gold-400" : "border-brand/30 text-brand hover:border-gold-500 hover:text-gold-600",
          )}
        >
          {b.label}
          <ArrowRight className="h-4 w-4 shrink-0 transition-transform group-hover/link:translate-x-1 rtl:rotate-180" aria-hidden />
        </CmsLink>
      ))}
    </div>
  );
}
