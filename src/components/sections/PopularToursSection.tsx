import { getLocale, getTranslations } from "next-intl/server";
import { ArrowRight, Calendar, MapPin } from "lucide-react";
import type { PageSection, Tour } from "@/types/cms";
import { formatPrice } from "@/lib/utils";
import { ButtonLink } from "@/components/ui/Button";
import { CmsImage } from "@/components/ui/CmsImage";
import { Section } from "@/components/ui/misc";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { TallTourCard } from "@/components/cards/TallTourCard";
import { Botanical, PaperEdge } from "./home/Decor";
import { reveal3d } from "@/lib/reveal";
import { seasonMonths } from "@/lib/season";
import { SeasonalTours } from "./SeasonalTours";
import { Heading, sectionData, sectionTheme, type SectionProps } from "./sectionParts";

// Card widths for a centred row of up to 3 cards: a last row with only 1 or 2 cards sits in the middle, not on the left.
const centredCard = "w-full sm:w-[calc((100%-var(--spacing-grid))/2)] lg:w-[calc((100%-2*var(--spacing-grid))/3)]";

/** Dark-green "featured tour" band: one tour presented large (popular-tours sections with the Split layout). */
async function FeaturedTourBand({ section, tour }: { section: PageSection; tour: Tour }) {
  const [tCommon, tTour, locale] = await Promise.all([getTranslations("common"), getTranslations("tour"), getLocale()]);
  const price = formatPrice(tour.price, tour.currency, locale);
  // Up to 4 different places from the itinerary, in order
  const stops = Array.from(new Set((tour.itinerary ?? []).map((day) => day.location?.trim()).filter((place): place is string => Boolean(place)))).slice(0, 4);

  return (
    <section className="relative overflow-hidden bg-forest-900 py-24 text-white sm:py-28" data-testid="featured-tour">
      <PaperEdge flip className="text-cream" />
      <Botanical className="text-white opacity-[0.05]" />
      <div className="container-page relative grid items-center gap-14 lg:grid-cols-2">
        {/* PHOTO + round close-up */}
        <div data-parallax="-32" className="relative">
          <CmsImage media={tour.heroMedia} alt={tour.heroMedia?.alt || tour.title} sizes="(min-width: 1024px) 50vw, 100vw" wrapperClassName="aspect-[4/3] rounded-[2rem] shadow-2xl" />
          <div data-parallax="48" className="absolute -inset-e-4 -top-6 h-32 w-32 overflow-hidden rounded-full border-4 border-gold-500 shadow-xl sm:h-40 sm:w-40" aria-hidden>
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
            <ButtonLink href={`/tours/${tour.slug}`} className="rounded-md">
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
      <PaperEdge className="text-cream" />
    </section>
  );
}

/** A section limited to one group of tours: a chosen category, or "In season now" (the seasonal category of the month). */
export function isCategorisedTours(section: PageSection) {
  return Boolean(section.settings?.category) || section.settings?.source === "season";
}

// "popularTours" section: a grid of tour cards, or with the Split layout one big featured tour and the rest below it
export async function PopularToursSection({ section: raw, ctx }: SectionProps) {
  const { theme, light } = sectionTheme(raw);
  // A general (uncategorised) tour section skips tours that a category section on the same page already shows.
  const tours = sectionData<Tour>(raw).filter((tour) => isCategorisedTours(raw) || !ctx.categorisedTours?.has(tour._id));
  if (!tours.length) return null;
  // "In season now": the season line follows the season ("(July – October)"), so a typed one can't go out of date.
  const months = raw.settings?.source === "season" ? seasonMonths(tours[0], await getLocale()) : undefined;
  const section = months ? { ...raw, badge: `(${months})` } : raw;

  // IN SEASON NOW (grid layout): heading, a 12-month season ruler and the tours
  if (section.settings?.source === "season" && (section.settings.layout ?? "grid") === "grid") {
    return <SeasonalTours section={section} tours={tours} ctx={ctx} theme={theme} light={light} />;
  }
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
            <div className="flex flex-wrap justify-center gap-grid">
              {more.map((tour, index) => (
                <div key={tour._id} className={centredCard} {...reveal3d(index)}>
                  <TourCard tour={tour} hideDescription={shared.has(tour.shortDescription?.trim() ?? "")} />
                </div>
              ))}
            </div>
          </Section>
        )}
      </>
    );
  }

  // STAGGERED LAYOUT: tall photo cards at different heights (left low, middle high, right a little bigger).
  // The pattern repeats every 3 cards; phones show a simple column.
  if (section.settings?.layout === "staggered") {
    const offsets = ["lg:mt-24", "lg:mt-0", "lg:mt-12"];
    const heights = ["aspect-[4/5] lg:aspect-[3/4.4]", "aspect-[4/5] lg:aspect-[3/4]", "aspect-[4/5] lg:aspect-[3/4.6]"];
    // Each card drifts at its own speed while scrolling (HomeMotion), for the layered 3D look
    const drift = ["30", "-20", "12"];
    return (
      <Section theme={theme} className="relative overflow-hidden">
        {!light && <Botanical />}
        <div data-scroll-reveal>
          <Heading section={section} light={light} ctx={ctx} />
        </div>
        <div className="relative grid grid-cols-1 items-start gap-grid sm:grid-cols-2 lg:grid-cols-[1fr_1fr_1.12fr] lg:gap-10 lg:pb-12">
          {tours.map((tour, index) => (
            <div key={tour._id} className={offsets[index % 3]} {...reveal3d(index)}>
              <div data-parallax={drift[index % 3]}>
                <TallTourCard tour={tour} className={heights[index % 3]} />
              </div>
            </div>
          ))}
        </div>
      </Section>
    );
  }

  // GRID LAYOUT
  return (
    <Section theme={theme} className="relative overflow-hidden">
      {!light && <Botanical />}
      <div data-scroll-reveal>
        <Heading section={section} light={light} ctx={ctx} />
      </div>
      {/* Centred rows of up to three cards (two tours stay card-sized too) */}
      <div className="relative flex flex-wrap justify-center gap-grid">
        {tours.map((tour, index) => (
          <div key={tour._id} className={centredCard} {...reveal3d(index)}>
            <TourCard tour={tour} hideDescription={shared.has(tour.shortDescription?.trim() ?? "")} />
          </div>
        ))}
      </div>
    </Section>
  );
}
