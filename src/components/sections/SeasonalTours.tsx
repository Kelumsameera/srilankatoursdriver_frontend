import { getLocale, getTranslations } from "next-intl/server";
import type { PageSection, Tour } from "@/types/cms";
import { cn } from "@/lib/utils";
import { colomboMonth, monthInRange, monthLabels, seasonRange } from "@/lib/season";
import { Section } from "@/components/ui/misc";
import { TourCard, sharedDescriptions } from "@/components/cards/TourCard";
import { reveal3d } from "@/lib/reveal";
import { Botanical } from "./home/Decor";
import { HeadingLinks, type SectionContext } from "./sectionParts";

const MONTHS = Array.from({ length: 12 }, (_, i) => i + 1);

/** Runs of consecutive in-season months as grid columns: Nov–Jun gives [11, 12] and [1, 6]. */
function seasonRuns(range: [number, number]) {
  const runs: [number, number][] = [];
  for (const m of MONTHS) {
    if (!monthInRange(m, range)) continue;
    const last = runs[runs.length - 1];
    if (last && last[1] === m - 1) last[1] = m;
    else runs.push([m, m]);
  }
  return runs;
}

/**
 * The year as a 12-month ruler: the season is a solid band (labelled "In season now") and a dot marks this month,
 * so visitors see at a glance why these tours are shown now. Decorative – the season line in the heading says the same.
 */
async function SeasonRuler({ range, light }: { range: [number, number]; light?: boolean }) {
  const [locale, tTour] = await Promise.all([getLocale(), getTranslations("tour")]);
  const { short, narrow } = monthLabels(locale);
  const now = colomboMonth();
  const runs = seasonRuns(range);
  const longest = runs.reduce((a, b) => (b[1] - b[0] > a[1] - a[0] ? b : a));

  return (
    <div aria-hidden className="mb-10 md:mb-12">
      {/* this month */}
      <div className="grid grid-cols-12">
        <span style={{ gridColumn: now }} className="mx-auto mb-2 h-2 w-2 rounded-full bg-gold-500" />
      </div>
      {/* the season band over a thin year line */}
      <div className="relative grid h-9 grid-cols-12 items-center sm:h-10">
        <span className={cn("absolute inset-x-0 top-1/2 h-1 -translate-y-1/2 rounded-full", light ? "bg-white/20" : "bg-forest-800/12")} />
        {runs.map(([from, to]) => (
          <span
            key={from}
            style={{ gridColumn: `${from} / ${to + 1}` }}
            className={cn(
              "relative flex h-full items-center justify-center overflow-hidden px-2 text-small font-medium",
              light ? "bg-gold-500 text-forest-950" : "bg-forest-800 text-white",
              from === range[0] || from === 1 ? "rounded-s-full" : "",
              to === range[1] || to === 12 ? "rounded-e-full" : "",
            )}
          >
            {from === longest[0] && <span className="truncate">{tTour("inSeason")}</span>}
          </span>
        ))}
      </div>
      {/* month names: one letter on phones */}
      <div className="mt-3 grid grid-cols-12 text-center text-xs">
        {MONTHS.map((m) => (
          <span
            key={m}
            className={cn(
              m === now ? "font-semibold" : "",
              m === now ? (light ? "text-gold-400" : "text-heading") : monthInRange(m, range) ? (light ? "text-white/85" : "text-ink") : light ? "text-white/45" : "text-muted",
            )}
          >
            <span className="sm:hidden">{narrow[m - 1]}</span>
            <span className="hidden sm:inline">{short[m - 1]}</span>
          </span>
        ))}
      </div>
    </div>
  );
}

/** "In season now" tours section: an editorial heading, the season ruler, then the tours (a swipeable row on phones). */
export async function SeasonalTours({ section, tours, ctx, theme, light }: { section: PageSection; tours: Tour[]; ctx: SectionContext; theme: string; light?: boolean }) {
  const range = seasonRange(tours[0]);
  const shared = sharedDescriptions(tours);
  return (
    <Section theme={theme} className="relative overflow-hidden">
      {!light && <Botanical />}
      <div data-scroll-reveal className="relative mb-8 grid gap-x-12 gap-y-4 md:mb-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,26rem)] lg:items-end">
        <div>
          {section.eyebrow && <p className={cn("eyebrow mb-3", light && "text-gold-400")}>{section.eyebrow}</p>}
          {section.title && (
            <h2 className={cn("text-3xl leading-tight sm:text-4xl lg:text-[2.75rem]", light ? "text-white" : "text-heading")}>
              {section.title}
              {section.badge && " "}
              {section.badge &&<span className={cn("mt-1 block font-display text-2xl italic sm:text-3xl", light ? "text-gold-400" : "text-gold-600")}>{section.badge}</span>}
            </h2>
          )}
        </div>
        {(section.subtitle || section.buttons?.length) && (
          <div className="flex flex-col gap-4">
            {section.subtitle && <p className={cn("text-lead leading-relaxed", light ? "text-white/80" : "text-ink")}>{section.subtitle}</p>}
            <HeadingLinks section={section} ctx={ctx} light={light} />
          </div>
        )}
      </div>

      {range && <SeasonRuler range={range} light={light} />}

      <div className="relative -mx-4 flex snap-x snap-mandatory scroll-px-4 gap-4 overflow-x-auto px-4 pb-2 sm:mx-0 sm:grid sm:grid-cols-2 sm:gap-grid sm:overflow-visible sm:px-0 sm:pb-0 lg:grid-cols-3">
        {tours.map((tour, index) => (
          <div key={tour._id} className="w-[82%] shrink-0 snap-start sm:w-auto" {...reveal3d(index)}>
            <TourCard tour={tour} hideDescription={shared.has(tour.shortDescription?.trim() ?? "")} />
          </div>
        ))}
      </div>
    </Section>
  );
}
