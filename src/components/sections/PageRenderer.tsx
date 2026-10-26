import { PageBody } from "@/components/ui/PageBody";
import type { CSSProperties } from "react";
import type { Destination, MediaAsset, PageSection, SiteSettings, Tour, TripAdvisorSummary } from "@/types/cms";
import { cn } from "@/lib/utils";
import { distinctPhotos, isDark, type SectionContext, type SectionProps } from "./sectionParts";
import { HeroSection } from "./HeroSection";
import { WhyChooseUsSection } from "./WhyChooseUsSection";
import { FeaturesSection } from "./FeaturesSection";
import { PopularToursSection, isCategorisedTours } from "./PopularToursSection";
import { DestinationsSection } from "./DestinationsSection";
import { ExcursionsSection } from "./ExcursionsSection";
import { VehiclesSection } from "./VehiclesSection";
import { TailorMadeSection } from "./TailorMadeSection";
import { CtaSection } from "./CtaSection";
import { TeamSection } from "./TeamSection";
import { OfferSection } from "./OfferSection";
import { GallerySection } from "./GallerySection";
import { GuestShortsSection } from "./GuestShortsSection";
import { ReviewsSection } from "./ReviewsSection";
import { TripAdvisorSection } from "./TripAdvisorSection";
import { BlogSection } from "./BlogSection";
import { FaqsSection } from "./FaqsSection";
import { RichTextSection } from "./RichTextSection";
import { ContactSection } from "./ContactSection";

// Picks the component for one CMS section type (the types the admin can add in Admin → Pages).
// The components are called as plain functions, not as <HeroSection />, so a section with nothing to show
// returns null right here. PageRenderer drops those before it picks the neighbouring colours.
async function renderSection(props: SectionProps) {
  switch (props.section.type) {
    case "hero":
      return HeroSection(props);
    case "whyChooseUs":
      return WhyChooseUsSection(props);
    case "features":
      return FeaturesSection(props);
    case "popularTours":
      return PopularToursSection(props);
    case "destinations":
      return DestinationsSection(props);
    case "excursions":
      return ExcursionsSection(props);
    case "vehicles":
      return VehiclesSection(props);
    case "tailorMade":
      return TailorMadeSection(props);
    case "cta":
      return CtaSection(props);
    case "team":
      return TeamSection(props);
    case "offer":
      return OfferSection(props);
    case "gallery":
      return GallerySection(props);
    case "guestShorts":
      return GuestShortsSection(props);
    case "reviews":
      return ReviewsSection(props);
    case "tripadvisor":
      return TripAdvisorSection(props);
    case "blog":
      return BlogSection(props);
    case "faqs":
      return FaqsSection(props);
    case "richText":
      return RichTextSection(props);
    case "contact":
      return ContactSection(props);
    default:
      // Unknown type (for example from a newer admin): show nothing
      return null;
  }
}

// The background colour a section paints, so its neighbours can blend their torn-paper edges into it
function sectionSurface(section?: PageSection) {
  if (!section) return "var(--color-sand-50)";
  const theme = section.settings?.theme ?? "light";
  if (section.type === "hero" || section.type === "tailorMade") return "var(--color-sand-50)";
  if (section.type === "destinations") return isDark(theme) ? surfaceForTheme(theme) : "var(--color-forest-800)";
  if (section.type === "vehicles" || section.type === "cta") return isDark(theme) ? "var(--color-forest-900)" : "var(--color-sand-100)";
  if (section.type === "whyChooseUs") return isDark(theme) ? "var(--color-forest-900)" : "var(--color-sand-50)";
  if (section.type === "popularTours" && section.settings?.layout === "split") return "var(--color-forest-900)";
  return surfaceForTheme(theme);
}

// Background colour of each section theme (Keep in sync with the theme colours in components/ui/misc.tsx Section)
function surfaceForTheme(theme: string) {
  return ({ light: "var(--color-sand-50)", sand: "var(--color-sand-100)", forest: "var(--color-forest-800)", dark: "var(--color-forest-950)" } as Record<string, string>)[theme] ?? "var(--color-sand-50)";
}

/** True when the page has an enabled hero section with slides. It then replaces the page's own header. */
export function hasActiveHero(sections?: PageSection[]) {
  return Boolean(sections?.some((s) => s.type === "hero" && s.enabled !== false && Array.isArray(s.data) && s.data.length > 0));
}

/**
 * Renders CMS page sections in the order configured in Admin → Pages.
 * Pages with their own header and listing render it in two parts: part="hero" at the top (only the hero),
 * part="body" below the listing (everything else). The page context is still built from all sections.
 */
export async function PageRenderer({
  sections,
  settings,
  preview,
  part,
  content,
  pageTitle,
}: {
  sections: PageSection[];
  settings: SiteSettings | null;
  preview?: boolean;
  part?: "hero" | "body";
  /** Page-level body text configured alongside the header in Admin > Pages. */
  content?: string;
  pageTitle?: string;
}) {
  // The preview (Admin → Pages) also shows switched-off sections, faded
  const visibleSections = sections
    .filter((section) => preview || section.enabled !== false)
    .filter((section) => !part || (part === "hero") === (section.type === "hero"));

  // PAGE CONTEXT: facts some sections need about the whole page
  const categorisedTours = new Set(
    sections
      .filter((s) => s.type === "popularTours" && isCategorisedTours(s) && s.enabled !== false && Array.isArray(s.data))
      .flatMap((s) => (s.data as Tour[]).map((t) => t._id)),
  );
  const highlights = sections.find((s) => s.type === "whyChooseUs" && s.enabled !== false)?.items ?? [];
  const photos = sections
    .filter((s) => (s.type === "destinations" || s.type === "popularTours") && Array.isArray(s.data))
    .flatMap((s) => (s.data as (Destination | Tour)[]).map((d) => d.heroMedia))
    .filter((m): m is MediaAsset => Boolean(m?.url && m.resourceType !== "video"));
  const hasHero = hasActiveHero(sections);
  const ta = sections.find((s) => s.type === "tripadvisor" && s.enabled !== false)?.data as TripAdvisorSummary | null | undefined;
  const rating = ta?.configured && ta.rating && ta.numReviews ? { value: ta.rating, count: ta.numReviews } : undefined;
  // Closing CTA (design: a sunset beach): prefer a coastal destination's photo, else the first tour/destination photo.
  const coastal = sections
    .filter((s) => s.type === "destinations" && Array.isArray(s.data))
    .flatMap((s) => s.data as Destination[])
    .find((d) => d.heroMedia?.url && d.heroMedia.resourceType !== "video" && /beach|coast|bay|mirissa|bentota|unawatuna|trincomalee|arugam|hikkaduwa|galle|pasikudah/i.test(`${d.name} ${d.slug} ${d.category?.name ?? ""}`));
  const ctx: SectionContext = { settings, pageTitle, preview, categorisedTours, highlights, photos: distinctPhotos(photos, 12), hasHero, rating, ctaPhoto: coastal?.heroMedia ?? photos[0] };

  // Empty CMS sections do not form a visual boundary. Resolve them before choosing neighbouring colours.
  const renderedSections = (await Promise.all(visibleSections.map(async (section) => ({
    section,
    content: await renderSection({ section, ctx }),
  })))).filter(({ content }) => content !== null);

  return (
    <>
      {part !== "hero" && <PageBody content={content} />}
      {renderedSections.map(({ section, content }, index) => (
        <div
          key={section._id}
          // The torn-paper edges read these to blend into the section above and below
          style={{
            "--previous-section-color": sectionSurface(renderedSections[index - 1]?.section),
            "--next-section-color": sectionSurface(renderedSections[index + 1]?.section),
          } as CSSProperties}
          data-section={section.type}
          // The hero contains the LCP text and image. It must paint at full opacity immediately instead of
          // waiting for the below-the-fold reveal observer to mark it visible.
          data-scroll-reveal={section.type === "hero" || (section.type === "popularTours" && section.settings?.layout !== "split") ? undefined : true}
          className={cn(preview && section.enabled === false && "relative opacity-60 outline-2 outline-dashed outline-gold-500")}
        >
          {content}
        </div>
      ))}
    </>
  );
}
