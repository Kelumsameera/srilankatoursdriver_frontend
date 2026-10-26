"use client";

import { useTranslations } from "next-intl";

/**
 * Shown at once while a page's data loads, so a click responds immediately. It is also what Next.js
 * prefetches for routes that read searchParams (tours, destinations, …), which render on each request.
 * A client component on purpose: loading.tsx gets no params, so server-side next-intl would read the
 * locale from headers() and make every page dynamic. Here the texts come from the layout's provider.
 */
export default function LocaleLoading() {
  const t = useTranslations("common");
  return (
    <div role="status" aria-live="polite" className="min-h-[80vh]">
      <span className="sr-only">{t("loading")}</span>
      <div className="h-[55vh] min-h-80 animate-pulse bg-forest-900" />
      <div className="container-page grid gap-6 py-16 sm:grid-cols-2 lg:grid-cols-3">
        {Array.from({ length: 3 }, (_, i) => (
          <div key={i} className="h-64 animate-pulse rounded-2xl bg-sand-100" />
        ))}
      </div>
    </div>
  );
}
