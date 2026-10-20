import { getTranslations } from "next-intl/server";
import { Landmark, Mountain, PawPrint, TreePalm } from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { Markdown } from "@/components/ui/Markdown";
import { editorialImages } from "@/lib/editorial-images";
import { GoldText, PaperEdge } from "./home/Decor";
import { Buttons, type SectionProps } from "./sectionParts";

/** Interest tiles of the tailor-made section (keys of `tailorMade.interests`). */
const INTEREST_TILES = [
  { key: "culture", icon: Landmark },
  { key: "beach", icon: TreePalm },
  { key: "wildlife", icon: PawPrint },
  { key: "adventure", icon: Mountain },
] as const;

/** Wavy vertical edge between a full-bleed photo and the content beside it (colour = the section background). */
function OrganicEdge({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 64 800" preserveAspectRatio="none" aria-hidden className={cn("pointer-events-none absolute inset-y-0 h-full w-10 xl:w-16", className)}>
      <path fill="currentColor" d="M64 0H38C22 70 46 130 30 200s-30 120-8 200 28 130 8 200-18 140 8 200h26Z" />
    </svg>
  );
}

// "tailorMade" section: a full-bleed photo beside the text, chips, buttons and four interest tiles
export async function TailorMadeSection({ section, ctx }: SectionProps) {
  const tTailorMade = await getTranslations("tailorMade");
  // Design: an ivory content panel beside a full-bleed photo, whatever theme is stored for the section.
  const light = false;
  // The section's own photo, else a real photo from this page, else an editorial road photo
  const photo = section.media?.url ? section.media : ctx.photos?.[2] ?? ctx.photos?.[0] ?? editorialImages.road;

  return (
    <section className={cn("relative overflow-x-clip", light ? "bg-forest-900 text-white" : "bg-sand-50")}>
      <div className="grid lg:grid-cols-2">
        {/* Full-bleed photo with a wavy edge towards the content (design). */}
        <div className="relative min-h-[18rem] overflow-hidden sm:min-h-[24rem] lg:min-h-[36rem]">
          <div data-parallax="-60" className="absolute -inset-y-16 inset-x-0">
            <CmsImage media={photo} alt={photo.alt || section.title || ""} sizes="(min-width: 1024px) 50vw, 100vw" wrapperClassName="absolute inset-0" />
          </div>
          <OrganicEdge className={cn("inset-e-0 hidden lg:block rtl:-scale-x-100", light ? "text-heading" : "text-cream")} />
          <PaperEdge className={cn("lg:hidden", light ? "text-heading" : "text-cream")} />
          {section.badge && (
            <p className="absolute inset-s-5 top-5 max-w-[11rem] rounded-2xl bg-gold-500 px-4 py-3 text-small font-semibold leading-tight text-forest-950 shadow-card">
              {section.badge}
            </p>
          )}
        </div>

        {/* TEXT: eyebrow, title, subtitle, content, chips, buttons */}
        <div className="px-5 py-section sm:px-10 lg:px-14 xl:px-20">
          <div className="max-w-xl">
            {section.eyebrow && <p className={cn("eyebrow mb-4", light && "text-gold-400")}>{section.eyebrow}</p>}
            {section.title && (
              <h2 className={cn("mb-5 text-3xl leading-tight sm:text-5xl", light ? "text-white" : "text-heading")}>
                <GoldText text={section.title} goldClass="font-display italic text-gold-500" />
              </h2>
            )}
            {section.subtitle && <p className={cn("mb-6 text-lead leading-relaxed", light ? "text-white/80" : "text-muted")}>{section.subtitle}</p>}
            {section.content && <Markdown content={section.content} className={cn("mb-8", light && "[&_*]:text-white/85")} />}
            {section.items?.length ? (
              <ul className="mb-8 flex flex-wrap gap-2">
                {section.items.slice(0, 6).map((it, i) => (
                  <li key={`${it.title}-${i}`} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", light ? "border-white/20 text-white/85" : "border-forest-950/10 text-brand")}>
                    {it.title}
                  </li>
                ))}
              </ul>
            ) : null}
            <Buttons section={section} ctx={ctx} light={light} />

            {/* INTEREST TILES: each one opens the tailor-made form */}
            <ul className={cn("mt-10 grid grid-cols-2 border-t pt-8 sm:grid-cols-4", light ? "border-white/15" : "border-forest-950/10")}>
              {INTEREST_TILES.map(({ key, icon: Icon }, i) => (
                <li key={key} className={cn(i > 0 && "sm:border-s", light ? "border-white/15" : "border-forest-950/10")}>
                  <CmsLink
                    href="/tailor-made-tours"
                    className={cn(
                      "flex h-full flex-col items-center gap-2 px-2 py-3 text-center text-xs font-medium transition-colors",
                      light ? "text-white/85 hover:text-gold-400" : "text-brand hover:text-gold-600",
                    )}
                  >
                    <Icon className={cn("h-8 w-8", light ? "text-gold-400" : "text-gold-600")} strokeWidth={1.4} aria-hidden />
                    {tTailorMade(`interests.${key}`)}
                  </CmsLink>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}
