import { Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { Markdown } from "@/components/ui/Markdown";
import { PaperEdge } from "./home/Decor";
import { Buttons, sectionTheme, type SectionProps } from "./sectionParts";

// "cta" section: a centred call-to-action banner, over a wide landscape photo when there is one
export function CtaSection({ section, ctx }: SectionProps) {
  const { light } = sectionTheme(section);
  // Design: a wide landscape photo behind the call to action. Without an uploaded one, a real photo from this page.
  const media = section.media?.url ? section.media : ctx.hasHero ? ctx.ctaPhoto : undefined;
  const hasMedia = Boolean(media?.url);

  return (
    <section className={cn("relative isolate overflow-hidden py-24 sm:py-28", light ? "bg-forest-900 text-white" : "bg-sand-100")}>
      {/* BACKGROUND: photo with a dark overlay, or a soft green glow on the dark theme */}
      {hasMedia && (
        <>
          <CmsImage media={media} alt="" wrapperClassName="absolute inset-0 -z-20" />
          <div className="absolute inset-0 -z-10 bg-linear-to-b from-forest-950/55 via-forest-950/65 to-forest-950/80" />
          <PaperEdge flip className="text-cream" />
        </>
      )}
      {!hasMedia && light && <div className="absolute -inset-s-40 -top-40 -z-10 h-120 w-120 rounded-full bg-forest-600/30 blur-3xl" aria-hidden />}

      {/* TEXT: eyebrow, title, subtitle, content, checklist, buttons */}
      <div className="container-page">
        <div className={cn("mx-auto max-w-3xl text-center", hasMedia && "text-white")}>
          {section.eyebrow && <p className={cn("eyebrow mb-4", (light || hasMedia) && "text-gold-400")}>{section.eyebrow}</p>}
          {section.title && <h2 className="text-3xl leading-tight sm:text-5xl">{section.title}</h2>}
          {section.subtitle && <p className={cn("mx-auto mt-5 max-w-2xl text-lead", light || hasMedia ? "text-white/80" : "text-muted")}>{section.subtitle}</p>}
          {section.content && <Markdown content={section.content} className="mt-6 text-start" />}
          {section.items?.length ? (
            <ul className="mx-auto mt-8 grid max-w-xl gap-3 text-start sm:grid-cols-2">
              {section.items.map((it, i) => (
                <li key={i} className="flex items-start gap-2">
                  <Check className="mt-0.5 h-5 w-5 shrink-0 text-gold-500" aria-hidden />
                  <span>{it.title}</span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10 flex justify-center">
            <Buttons section={section} ctx={ctx} light={light || hasMedia} />
          </div>
        </div>
      </div>
    </section>
  );
}
