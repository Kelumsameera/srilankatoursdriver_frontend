import { Check } from "lucide-react";
import type { MediaAsset } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { Markdown } from "@/components/ui/Markdown";
import { FeatureIcon } from "@/components/ui/icons";
import { GoldText } from "./home/Decor";
import { FernBranch } from "./home/Foliage";
import { Buttons, distinctPhotos, sectionTheme, type SectionProps } from "./sectionParts";

/** Three overlapping photos (design: one large photo with two smaller cards laid over it at different angles). */
function OverlapGallery({ photos }: { photos: MediaAsset[] }) {
  const [a, b, c] = photos;
  return (
    <div className="relative mx-auto w-full max-w-[28rem] pb-12 pt-4 sm:pb-16 sm:pt-6 xl:max-w-xl" aria-hidden>
      <div className="relative z-0 w-[74%] -rotate-2 rounded-2xl bg-white p-2 shadow-card sm:p-2.5">
        <CmsImage media={a} alt="" sizes="(min-width: 1280px) 420px, (min-width: 768px) 33vw, 74vw" wrapperClassName="aspect-[5/6] rounded-xl" />
      </div>
      {b && (
        <div className="absolute inset-e-0 top-0 z-10 w-[48%] rotate-3 rounded-2xl bg-white p-2 shadow-card sm:p-2.5">
          <CmsImage media={b} alt="" sizes="(min-width: 1024px) 20vw, 46vw" wrapperClassName="aspect-[4/3] rounded-xl" />
        </div>
      )}
      {c && (
        <div className="absolute bottom-0 inset-e-[3%] z-20 w-[52%] -rotate-[4deg] rounded-2xl bg-white p-2 shadow-card sm:p-2.5">
          <CmsImage media={c} alt="" sizes="(min-width: 1024px) 22vw, 50vw" wrapperClassName="aspect-[4/3] rounded-xl" />
        </div>
      )}
    </div>
  );
}

// "whyChooseUs" section: title and benefits on one side, three overlapping photos on the other
export function WhyChooseUsSection({ section, ctx }: SectionProps) {
  const { light } = sectionTheme(section);
  const items = (section.items ?? []).filter((it) => it.title);
  const gallery = distinctPhotos([section.media, ...(section.items ?? []).map((it) => it.image), ...(ctx.photos ?? [])], 3);
  // With a hero on the page the items' titles and icons are already in the trust row, so here the benefits are
  // listed by their descriptions (design: a short check list).
  const asChecklist = ctx.hasHero && items.some((it) => it.description);

  return (
    <section className={cn("relative overflow-x-clip pb-section pt-16 sm:pt-20 lg:pt-24", light ? "bg-forest-900 text-white" : "bg-sand-50")}>
      <FernBranch className={cn("absolute -bottom-10 -left-10 hidden w-44 md:block lg:w-52", light ? "text-white/10" : "text-forest-700/20")} />
      <div className={cn("container-page relative grid items-center gap-10 lg:gap-12", gallery.length && "md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]")}>
        {/* TEXT: eyebrow, title, subtitle, content, benefits, buttons */}
        <div>
          {section.eyebrow && <p className={cn("eyebrow mb-4", light && "text-gold-400")}>{section.eyebrow}</p>}
          {section.title && (
            <h2 className={cn("max-w-xl text-4xl leading-[1.08] sm:text-5xl", light ? "text-white" : "text-forest-900")}>
              <GoldText text={section.title} goldClass="font-display italic text-gold-600" />
            </h2>
          )}
          {section.subtitle && <p className={cn("mt-5 max-w-xl text-lead leading-relaxed", light ? "text-white/75" : "text-muted")}>{section.subtitle}</p>}
          {section.content && <Markdown content={section.content} className="mt-5 max-w-xl" />}
          {asChecklist ? (
            <ul className="mt-8 max-w-xl space-y-3">
              {items
                .filter((it) => it.description)
                .map((item, i) => (
                  <li key={`${item.title}-${i}`} className={cn("flex items-start gap-3 text-[0.95rem] leading-snug", light ? "text-white/85" : "text-ink/85")}>
                    <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-gold-500 text-white" aria-hidden>
                      <Check className="h-3 w-3" strokeWidth={3} />
                    </span>
                    {item.description}
                  </li>
                ))}
            </ul>
          ) : items.length > 0 ? (
            <ul className={cn("mt-10 grid gap-x-6 gap-y-7 sm:grid-cols-2", !gallery.length && "lg:grid-cols-4")}>
              {items.map((item, i) => (
                <li key={`${item.title}-${i}`} className="flex items-start gap-4">
                  <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-gold-500/50 bg-white/60 text-gold-600">
                    <FeatureIcon name={item.icon} className="h-6 w-6" />
                  </span>
                  <span>
                    <span className={cn("block font-semibold leading-tight", light ? "text-white" : "text-forest-900")}>{item.title}</span>
                    {item.description && <span className={cn("mt-1 block text-small leading-snug", light ? "text-white/70" : "text-muted")}>{item.description}</span>}
                  </span>
                </li>
              ))}
            </ul>
          ) : null}
          <div className="mt-10">
            <Buttons section={section} ctx={ctx} light={light} />
          </div>
        </div>

        {/* PHOTOS */}
        {gallery.length > 0 && <OverlapGallery photos={gallery} />}
      </div>
    </section>
  );
}
