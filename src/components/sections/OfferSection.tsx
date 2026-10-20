import { getTranslations } from "next-intl/server";
import { Check, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { Buttons, type SectionProps } from "./sectionParts";

// "offer" section: a package card with what's included, bonuses (items with the "star" icon) and the price
export async function OfferSection({ section, ctx }: SectionProps) {
  const tOffer = await getTranslations("offer");
  const items = (section.items ?? []).filter((it) => it.title);
  const included = items.filter((it) => it.icon !== "star");
  const bonuses = items.filter((it) => it.icon === "star");

  return (
    <section className="bg-linear-to-b from-sand-50 to-sand-100 px-4 py-section max-sm:px-0 max-sm:py-8" data-testid="offer-section">
      <div className="container-page max-w-6xl">
        {section.eyebrow && <h2 className="mb-10 text-center text-3xl max-sm:mb-5 max-sm:text-2xl text-heading lg:text-5xl">{section.eyebrow}</h2>}
        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/60 bg-surface/85 px-8 pb-12 pt-24 shadow-card backdrop-blur max-sm:rounded-2xl max-sm:px-4 max-sm:pb-5 max-sm:pt-16 lg:p-16 lg:pt-24">
          <div className="pointer-events-none absolute -inset-e-20 -top-20 h-72 w-72 rounded-full bg-gold-200/40 blur-[120px]" aria-hidden />
          {section.badge && (
            <p className="absolute inset-s-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-full bg-linear-to-r from-forest-700 to-forest-900 px-6 py-3 text-small font-semibold text-gold-400 shadow-card max-sm:top-4 max-sm:max-w-[calc(100%-2rem)] max-sm:whitespace-normal max-sm:px-4 max-sm:py-2 max-sm:text-xs max-sm:text-center rtl:translate-x-1/2">
              {section.badge}
            </p>
          )}
          {section.title && <h3 className="mb-6 text-center text-3xl max-sm:mb-3 max-sm:text-2xl text-heading lg:text-start lg:text-5xl">{section.title}</h3>}
          {section.subtitle && <p className="mb-12 max-w-2xl text-center text-lead leading-relaxed text-muted max-sm:mb-5 max-sm:text-sm max-sm:leading-6 lg:text-start">{section.subtitle}</p>}
          <div className="grid grid-cols-1 gap-12 max-sm:gap-5 lg:grid-cols-2 lg:gap-16">
            {/* INCLUDED */}
            {included.length > 0 && (
              <div>
                <h4 className="mb-6 font-sans text-h3 font-semibold text-heading max-sm:mb-3 max-sm:text-base">{tOffer("included")}</h4>
                <ul className="space-y-4 max-sm:space-y-2">
                  {included.map((it, i) => (
                    <li key={`${it.title}-${i}`} className="flex items-center gap-3 text-ink max-sm:items-start max-sm:gap-2 max-sm:text-sm max-sm:leading-5">
                      <Check className="h-5 w-5 shrink-0 max-sm:mt-0.5 max-sm:h-4 max-sm:w-4 text-forest-600" aria-hidden /> {it.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* BONUSES, PRICE, BUTTONS */}
            <div>
              {bonuses.length > 0 && (
                <>
                  <h4 className="mb-6 font-sans text-h3 font-semibold text-heading max-sm:mb-3 max-sm:text-base">{tOffer("bonuses")}</h4>
                  <ul className="space-y-4 max-sm:space-y-2">
                    {bonuses.map((it, i) => (
                      <li key={`${it.title}-${i}`} className="flex items-center gap-3 text-ink max-sm:items-start max-sm:gap-2 max-sm:text-sm max-sm:leading-5">
                        <Star className="h-5 w-5 shrink-0 max-sm:mt-0.5 max-sm:h-4 max-sm:w-4 fill-gold-500 text-gold-500" aria-hidden /> {it.title}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {section.price && (
                <div className="mt-10 text-center max-sm:mt-5 lg:text-start">
                  <p className="text-muted">{tOffer("priceLabel")}</p>
                  <p className="mt-1 font-display text-5xl text-brand max-sm:text-4xl lg:text-6xl">{section.price}</p>
                  {section.priceNote && <p className="mb-6 mt-2 text-muted max-sm:mb-4 max-sm:text-sm">{section.priceNote}</p>}
                </div>
              )}
              <div className={cn("flex justify-center lg:justify-start", !section.price && "mt-10 max-sm:mt-5")}>
                <Buttons section={section} ctx={ctx} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
