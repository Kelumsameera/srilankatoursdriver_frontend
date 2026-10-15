// "use client" is needed because this component uses useState / useEffect and button clicks.
"use client";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import { ArrowLeft, ArrowRight } from "lucide-react";
import { useTranslations } from "next-intl";
import type { Destination } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";
import { CmsLink } from "@/components/ui/CmsLink";
import { destinationCover } from "@/lib/editorial-images";

// Category buttons + the grid of destination cards.
// The chosen category is kept in the URL (?category=beach) so a filtered list can be shared or reloaded.
export function DestinationsBrowser({ destinations, initialCategory }: { destinations: Destination[]; initialCategory?: string }) {
  const t = useTranslations("destination");
  const listRef = useRef<HTMLUListElement>(null);
  const listId = useId();
  const [position, setPosition] = useState<{ category?: string; index: number }>({ index: 0 });

  // One button per category that the destinations actually use, sorted A-Z
  const categories = useMemo(() => {
    const namesBySlug = new Map<string, string>();
    for (const destination of destinations) {
      if (destination.category?.slug && !namesBySlug.has(destination.category.slug)) {
        namesBySlug.set(destination.category.slug, destination.category.name);
      }
    }
    return [...namesBySlug].map(([slug, name]) => ({ slug, name })).sort((a, b) => a.name.localeCompare(b.name));
  }, [destinations]);

  // undefined = "All". A ?category= value that does not exist is ignored.
  const [activeCategory, setActiveCategory] = useState(() => (categories.some((category) => category.slug === initialCategory) ? initialCategory : undefined));

  // Write the chosen category into the URL without reloading the page
  useEffect(() => {
    const url = new URL(window.location.href);
    if (activeCategory) url.searchParams.set("category", activeCategory);
    else url.searchParams.delete("category");
    url.searchParams.delete("page");
    window.history.replaceState(window.history.state, "", url);
  }, [activeCategory]);

  // The browser back / forward buttons change the URL, so read the category back from it
  useEffect(() => {
    function onBackOrForward() {
      setActiveCategory(new URL(window.location.href).searchParams.get("category") ?? undefined);
    }
    window.addEventListener("popstate", onBackOrForward);
    return () => window.removeEventListener("popstate", onBackOrForward);
  }, []);

  const visibleDestinations = activeCategory ? destinations.filter((destination) => destination.category?.slug === activeCategory) : destinations;
  const pageSize = 6;
  const pageCount = Math.ceil(visibleDestinations.length / pageSize);
  const currentPage = position.category === activeCategory ? Math.min(position.index, Math.max(pageCount - 1, 0)) : 0;
  const firstPage = Math.max(0, Math.min(currentPage - 2, pageCount - 5));
  const pageNumbers = Array.from({ length: Math.min(5, pageCount) }, (_, index) => firstPage + index);
  const paginationClass = "flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-gold-400 text-sm text-forest-800 disabled:opacity-35 focus-visible:outline-2 focus-visible:outline-offset-2";

  function goToPage(page: number) {
    setPosition({ category: activeCategory, index: page });
    listRef.current?.scrollIntoView({ block: "start", behavior: "instant" });
  }

  // Tailwind classes for a category button (dark green when selected)
  function buttonClass(selected: boolean) {
    return cn(
      "inline-flex min-h-9 items-center rounded-full border px-3 text-xs sm:min-h-11 sm:px-5 sm:text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-800",
      selected ? "border-forest-800 bg-forest-800 text-white" : "border-gold-400 bg-white text-forest-800 hover:border-forest-800",
    );
  }

  return (
    <div>
      {/* CATEGORY BUTTONS */}
      {categories.length > 1 && (
        <div role="group" aria-label={t("filterLabel")} className="mb-3 flex flex-wrap gap-1.5 sm:mb-4 sm:gap-2.5" data-testid="destination-filters">
          <button type="button" aria-pressed={!activeCategory} className={buttonClass(!activeCategory)} onClick={() => setActiveCategory(undefined)}>
            {t("allCategories")}
          </button>
          {categories.map((category) => (
            <button
              key={category.slug}
              type="button"
              aria-pressed={activeCategory === category.slug}
              className={buttonClass(activeCategory === category.slug)}
              onClick={() => setActiveCategory(category.slug)}
            >
              {category.name}
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
        <ul key={activeCategory || "all"} id={listId} ref={listRef}
          className="grid scroll-mt-24 grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8" data-testid="destination-list">
          {visibleDestinations.map((destination, index) => {
            const cover = destinationCover(destination);
            return (
              <li key={destination._id} className={cn("min-w-0", Math.floor(index / pageSize) !== currentPage && "hidden sm:block")}>
                <CmsLink
                  href={`/destinations/${destination.slug}`}
                  className="dest-card group flex h-full flex-col overflow-hidden rounded-lg bg-white shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-forest-800"
                >
                  {/* IMAGE */}
                  <CmsImage
                    media={cover}
                    alt={cover?.alt || destination.name}
                    placeholderName={destination.name}
                    sizes="(max-width: 639px) 100vw, (max-width: 1023px) 50vw, 400px"
                    wrapperClassName="aspect-[16/10] sm:aspect-[4/3]"
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
            <button key={page} type="button" aria-controls={listId} aria-current={currentPage === page ? "page" : undefined} onClick={() => goToPage(page)} className={cn(paginationClass, currentPage === page && "border-forest-800 bg-forest-800 text-white")}>
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
