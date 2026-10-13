import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import type { PageSection, Tour } from "@/types/cms";
import { formatPrice } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Section } from "@/components/ui/misc";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { Botanical, PaperEdge } from "./home/Decor";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

/** Dark-green "featured tour" band: one tour presented large (popular-tours sections with the Split layout). */
async function FeaturedTourBand({ section, tour }: { section: PageSection; tour: Tour }) {
  const [tCommon, tTour, locale] = await Promise.all([getTranslations("common"), getTranslations("tour"), getLocale()]);
  const price = formatPrice(tour.price, tour.currency, locale);
  // Up to 4 different places from the itinerary, in order
  const stops = Array.from(new Set((tour.itinerary ?? []).map((day) => day.location?.trim()).filter((place): place is string => Boolean(place)))).slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 text-white sm:py-28" data-testid="featured-tour">
      <PaperEdge flip className="text-sand-50" />
      <Botanical className="text-white opacity-[0.05]" />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
        {/* PHOTO + round close-up */}
        <div className="relative">
          <CmsImage media={tour.heroMedia} alt={tour.heroMedia?.alt || tour.title} sizes="(min-width: 1024px) 50vw, 100vw" wrapperClassName="aspect-[4/3] rounded-[2rem] shadow-2xl" />
          <div className="absolute -inset-e-4 -top-6 h-32 w-32 overflow-hidden rounded-full border-4 border-gold-500 shadow-xl sm:h-40 sm:w-40" aria-hidden>
            <CmsImage media={tour.heroMedia} alt="" sizes="160px" wrapperClassName="absolute inset-0" className="scale-150" />
          </div>
        </div>

        {/* TEXT: title, days and stops, subtitle, itinerary button, price */}
        <div>
          {section.eyebrow && <p className="eyebrow mb-4 text-gold-400">{section.eyebrow}</p>}
          {section.title && <p className="mb-2 font-display text-h3 text-white/70">{section.title}{section.badge ? ` ${section.badge}` : ""}</p>}
          <h2 className="text-4xl leading-tight sm:text-5xl">{tour.title}</h2>
          <ul className="mt-6 flex flex-wrap gap-x-5 gap-y-2 text-small text-white/80">
            {tour.durationDays ? (
              <li className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 shrink-0 text-gold-400" aria-hidden /> {tCommon("days", { count: tour.durationDays })}
              </li>
            ) : null}
            {stops.map((stop) => (
              <li key={stop} className="flex items-center gap-1.5">
                <MapPin className="h-4 w-4 shrink-0 text-gold-400" aria-hidden /> {stop}
              </li>
            ))}
          </ul>
          {section.subtitle && <p className="mt-6 max-w-xl text-lead leading-relaxed text-white/80">{section.subtitle}</p>}
          <div className="mt-9 flex flex-wrap items-center gap-6">
            <ButtonLink href={`/tours/${tour.slug}`} variant="outline-light" className="rounded-md border-gold-400 text-gold-400 hover:bg-gold-400 hover:text-forest-950">
              {tTour("itinerary")} <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
            </ButtonLink>
            {price && (
              <p className="text-small text-white/70">
                {tCommon("from")} <span className="font-display text-2xl text-gold-400">{price}</span>
              </p>
            )}
          </div>
        </div>
      </div>
      <PaperEdge className="text-sand-50" />
    </section>
  );
}

// "popularTours" section: a grid of tour cards, or with the Split layout one big featured tour and the rest below it
export function PopularToursSection({ section, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(section);
  // A general (uncategorised) tour section skips tours that a category section on the same page already shows.
  const tours = sectionData<Tour>(section).filter((tour) => section.settings?.category || !ctx.categorisedTours?.has(tour._id));
  if (!tours.length) return null;
  // Descriptions that several cards share are hidden, so the grid doesn't repeat the same text
  const shared = sharedDescriptions(tours);

  // SPLIT LAYOUT: featured band + the other tours
  if (section.settings?.layout === "split") {
    const [lead, ...more] = tours;
    return (
      <>
        <FeaturedTourBand section={section} tour={lead} />
        {more.length > 0 && (
          <Section theme={theme}>
            <div className="grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
              {more.map((tour) => (
                <TourCard key={tour._id} tour={tour} hideDescription={shared.has(tour.shortDescription?.trim() ?? "")} />
              ))}
            </div>
          </Section>
        )}
      </>
    );
  }

  // GRID LAYOUT
  return (
    <Section theme={theme} className="relative overflow-hidden">
      {!light && <Botanical />}
      <Heading section={section} light={light} ctx={ctx} />
      <div className="relative grid grid-cols-1 gap-grid sm:grid-cols-2 lg:grid-cols-3">
        {tours.map((tour) => (
          <TourCard key={tour._id} tour={tour} hideDescription={shared.has(tour.shortDescription?.trim() ?? "")} />
        ))}
      </div>
    </Section>
  );
}
