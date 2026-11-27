// "use client" is needed because this component uses useState / useEffect and button clicks.
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Destination } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { reveal3d } from "@/lib/reveal";
import { destinationCover } from "@/lib/editorial-images";

// Location buttons + the grid of destination cards.
// The chosen destination is kept in the URL (?location=ella) so a filtered list can be shared or reloaded.
export function DestinationsBrowser({ destinations, initialLocation, eagerFirstImage = false }: { destinations: Destination[]; initialLocation?: string; eagerFirstImage?: boolean }) {
  const t = useTranslations("destination");
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [position, setPosition] = useState<{ location?: string; index: number }>({ index: 0 });

  // One button per available destination location, sorted A-Z.
  const locations = useMemo(() => {
    const namesBySlug = new Map<string, string>();
    for (const destination of destinations) {
      if (destination.slug && !namesBySlug.has(destination.slug)) {
        namesBySlug.set(destination.slug, destination.name);
      }
    }
    return [...namesBySlug].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [destinations]);

  // undefined = "All". A ?location= value that does not exist is ignored.
  const [activeLocation, setActiveLocation] = useState(() => (locations.some((location) => location.slug === initialLocation) ? initialLocation : undefined));

  // Write the chosen location into the URL without reloading the page.
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeLocation) url.searchParams.set("location", activeLocation);
    else url.searchParams.delete("location");
    url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }, [activeLocation]);

  // The browser back / forward buttons change the URL, so read the location back from it.
  useEffect(() => {
    function onBackOrForward() {
      setActiveLocation(new URL(window.location.href).searchParams.get("location") ?? undefined);
    }
    window.addEventListener("popstate", onBackOrForward);
    return () => window.removeEventListener("popstate", onBackOrForward);
  }, []);

  // Cards A-Z by the (translated) name
  const sorted = [...destinations].sort((a, b) => a.name.localeCompare(b.name));
  const visibleDestinations = activeLocation ? sorted.filter((destination) => destination.slug === activeLocation) : sorted;
  const pageSize = 6;
  const pageCount = Math.ceil(visibleDestinations.length / pageSize);
  const currentPage = position.location === activeLocation ? Math.min(position.index, Math.max(pageCount - 1, 0)) : 0;
  const firstPage = Math.max(0, Math.min(currentPage - 2, pageCount - 5));
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index);
  const paginationClass = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400 text-sm text-brand disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2";

  function goToPage(page: number) {
    setPosition({ location: activeLocation, index: page });
    listRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  // Tailwind classes for a location button (dark green when selected).
  function buttonClass(selected: boolean) {
    return cn(
      "inline-flex min-h-9 items-center rounded-full border px-3 text-xs sm:min-h-11 sm:px-5 sm:text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand",
      selected ? "border-brand bg-forest-800 text-white" : "border-gold-400 bg-surface text-brand hover:border-brand",
    );
  }

  return (
    <div>
      {/* LOCATION BUTTONS */}
      {locations.length > 1 && (
        <div role="group" aria-label={t("filterLabel")} className="mb-3 flex flex-wrap gap-1.5 sm:mb-4 sm:gap-2.5" data-testid="destination-filters">
          <button type="button" aria-pressed={!activeLocation} className={buttonClass(!activeLocation)} onClick={() => setActiveLocation(undefined)}>
            {t("allCategories")}
          </button>
          {locations.map((location) => (
            <button
              key={location.slug}
              type="button"
              aria-pressed={activeLocation === location.slug}
              className={buttonClass(activeLocation === location.slug)}
              onClick={() => setActiveLocation(location.slug)}
            >
              {location.name}
            </button>
          ))}
        </div>
      )}

      {/* RESULT COUNT (read out by screen readers when it changes) */}
      <div className="mb-4 flex items-center justify-between gap-3 sm:mb-8">
      <p className="text-xs text-muted sm:text-sm" aria-live="polite">
        {t("resultsCount", { count: visibleDestinations.length })}
      </p>
      </div>

      {/* DESTINATION CARDS */}
      {visibleDestinations.length ? (
        <ul key={activeLocation || "all"} id={listId} ref={listRef}
          className="grid-center-last grid scroll-mt-24 grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8" data-testid="destination-list">
          {visibleDestinations.map((destination, index) => {
            const cover = destinationCover(destination);
            return (
              <li key={destination._id} className={cn("min-w-0", Math.floor(index / pageSize) !== currentPage && "hidden sm:block")} {...reveal3d(index)}>
                <CmsLink
                  href={`/destinations/${destination.slug}`}
                  className="dest-card group flex h-full flex-col overflow-hidden rounded-lg bg-surface shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand"
                >
                  {/* IMAGE */}
                  <CmsImage
                    media={cover}
                    loading={eagerFirstImage && index === 0 ? "eager" : undefined}
                    alt={cover?.alt || destination.name}
                    placeholderName={destination.name}
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 400px"
                    wrapperClassName="aspect-[16/10] sm:aspect-[4/3]"
                    depth
                    className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  {/* CATEGORY, NAME, SHORT DESCRIPTION */}
                  <div className="flex flex-1 flex-col p-4 sm:p-6">
                    {destination.category?.name && <p className="text-xs font-semibold uppercase tracking-label text-gold-600">{destination.category.name}</p>}
                    <h2 className="mt-2 wrap-break-word font-display text-xl text-ink sm:text-2xl">{destination.name}</h2>
                    {destination.shortDescription && <p className="mt-2 line-clamp-3 text-sm leading-6 sm:mt-3 sm:leading-7 text-muted">{destination.shortDescription}</p>}
                  </div>
                </CmsLink>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-16 text-center text-muted">{t("noMatches")}</p>
      )}
      {pageCount > 1 && (
        <div className="mt-6 flex flex-wrap items-center justify-center gap-1 sm:hidden" role="group" aria-label={t("destinationsLabel")} data-testid="destination-pagination">
          <button type="button" aria-label={t("previous")} aria-controls={listId} disabled={currentPage === 0} onClick={() => goToPage(currentPage - 1)} className={paginationClass}>
            <ArrowLeft className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
          {pageNumbers.map((page) => (
            <button key={page} type="button" aria-controls={listId} aria-current={currentPage === page ? "page" : undefined} onClick={() => goToPage(page)} className={cn(paginationClass, currentPage === page && "border-brand bg-forest-800 text-white")}>
              {page + 1}
            </button>
          ))}
          <button type="button" aria-label={t("next")} aria-controls={listId} disabled={currentPage === pageCount - 1} onClick={() => goToPage(currentPage + 1)} className={paginationClass}>
            <ArrowRight className="h-4 w-4 rtl:rotate-180" aria-hidden />
          </button>
        </div>
      )}
    </div>
  );
}
