// "use client" is needed because this component uses useState / useEffect and button clicks.
"use client";

import { useEffect, useMemo, useState } from "react";
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

  // Tailwind classes for a category button (dark green when selected)
  function buttonClass(selected: boolean) {
    return cn(
      "inline-flex min-h-11 items-center rounded-full border px-5 text-sm font-medium transition-colors duration-200 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-forest-800",
      selected ? "border-forest-800 bg-forest-800 text-white" : "border-gold-400 bg-white text-forest-800 hover:border-forest-800",
    );
  }

  return (
    <div>
      {/* CATEGORY BUTTONS */}
      {categories.length > 1 && (
        <div role="group" aria-label={t("filterLabel")} className="mb-4 flex flex-wrap gap-2.5" data-testid="destination-filters">
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
      <p className="mb-8 text-sm text-muted" aria-live="polite">
        {t("resultsCount", { count: visibleDestinations.length })}
      </p>

      {/* DESTINATION CARDS */}
      {visibleDestinations.length ? (
        <ul className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 lg:gap-8" data-testid="destination-list">
          {visibleDestinations.map((destination) => {
            const cover = destinationCover(destination);
            return (
              <li key={destination._id} className="min-w-0">
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
                    wrapperClassName="aspect-[4/3]"
                    className="transition-transform duration-300 group-hover:scale-[1.03] motion-reduce:transition-none motion-reduce:group-hover:scale-100"
                  />
                  {/* CATEGORY, NAME, SHORT DESCRIPTION */}
                  <div className="flex flex-1 flex-col p-6">
                    {destination.category?.name && <p className="text-xs font-semibold uppercase tracking-label text-gold-600">{destination.category.name}</p>}
                    <h2 className="mt-2 wrap-break-word font-display text-2xl text-ink">{destination.name}</h2>
                    {destination.shortDescription && <p className="mt-3 line-clamp-3 text-sm leading-7 text-muted">{destination.shortDescription}</p>}
                  </div>
                </CmsLink>
              </li>
            );
          })}
        </ul>
      ) : (
        <p className="py-16 text-center text-muted">{t("noMatches")}</p>
      )}
    </div>
  );
}
