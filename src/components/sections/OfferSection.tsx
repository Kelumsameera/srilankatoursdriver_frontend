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
    <section className="bg-linear-to-b from-sand-50 to-sand-100 px-4 py-section" data-testid="offer-section">
      <div className="container-page max-w-6xl">
        {section.eyebrow && <h2 className="mb-10 text-center text-3xl text-forest-900 lg:text-5xl">{section.eyebrow}</h2>}
        <div className="relative overflow-hidden rounded-[2.25rem] border border-white/60 bg-white/85 px-8 pb-12 pt-24 shadow-card backdrop-blur lg:p-16 lg:pt-24">
          <div className="pointer-events-none absolute -inset-e-20 -top-20 h-72 w-72 rounded-full bg-gold-200/40 blur-[120px]" aria-hidden />
          {section.badge && (
            <p className="absolute inset-s-1/2 top-6 -translate-x-1/2 whitespace-nowrap rounded-full bg-linear-to-r from-forest-700 to-forest-900 px-6 py-3 text-small font-semibold text-gold-400 shadow-card rtl:translate-x-1/2">
              {section.badge}
            </p>
          )}
          {section.title && <h3 className="mb-6 text-center text-3xl text-forest-900 lg:text-start lg:text-5xl">{section.title}</h3>}
          {section.subtitle && <p className="mb-12 max-w-2xl text-center text-lead leading-relaxed text-muted lg:text-start">{section.subtitle}</p>}
          <div className="grid grid-cols-1 gap-12 lg:grid-cols-2 lg:gap-16">
            {/* INCLUDED */}
            {included.length > 0 && (
              <div>
                <h4 className="mb-6 font-sans text-h3 font-semibold text-forest-900">{tOffer("included")}</h4>
                <ul className="space-y-4">
                  {included.map((it, i) => (
                    <li key={`${it.title}-${i}`} className="flex items-center gap-3 text-ink">
                      <Check className="h-5 w-5 shrink-0 text-forest-600" aria-hidden /> {it.title}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* BONUSES, PRICE, BUTTONS */}
            <div>
              {bonuses.length > 0 && (
                <>
                  <h4 className="mb-6 font-sans text-h3 font-semibold text-forest-900">{tOffer("bonuses")}</h4>
                  <ul className="space-y-4">
                    {bonuses.map((it, i) => (
                      <li key={`${it.title}-${i}`} className="flex items-center gap-3 text-ink">
                        <Star className="h-5 w-5 shrink-0 fill-gold-500 text-gold-500" aria-hidden /> {it.title}
                      </li>
                    ))}
                  </ul>
                </>
              )}
              {section.price && (
                <div className="mt-10 text-center lg:text-start">
                  <p className="text-muted">{tOffer("priceLabel")}</p>
                  <p className="font-display text-5xl text-forest-800 lg:text-6xl">{section.price}</p>
                  {section.priceNote && <p className="mb-6 text-muted">{section.priceNote}</p>}
                </div>
              )}
              <div className={cn("flex justify-center lg:justify-start", !section.price && "mt-10")}>
                <Buttons section={section} ctx={ctx} />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
