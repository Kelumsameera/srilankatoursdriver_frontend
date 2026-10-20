import { getLocale, getTranslations } from "next-intl/server";
import type { SiteSettings } from "@/types/cms";
import { formatPrice } from "@/lib/utils";

import { RatesDisclosure } from "./RatesDisclosure";

const VEHICLES = ["car", "van", "bus"] as const;

/**
 * "Tour Package Rates – Fixed rates from Airport (CMB)": the transfer price table managed in
 * Admin → Transfer Rates. Hidden when disabled or empty; vehicle columns without any price are dropped.
 */
export async function TransferRates({ settings, id = "rates", compact = false, collapsible = false }: { settings: SiteSettings | null; id?: string; compact?: boolean; collapsible?: boolean }) {
  const cfg = settings?.transferRates;
  const rows = (cfg?.rows ?? []).filter((r) => r.destination);
  if (!cfg || cfg.enabled === false || !rows.length) return null;
  const [t, locale] = await Promise.all([getTranslations("rates"), getLocale()]);
  const currency = cfg.currency || settings?.currency || "USD";
  const columns = VEHICLES.filter((v) => rows.some((r) => typeof r[v] === "number"));
  const showDuration = rows.some((r) => r.duration);
  const showDistance = rows.some((r) => typeof r.distanceKm === "number");
  const pill = { car: "bg-forest-50 text-brand-soft", van: "bg-gold-100 text-earth-700", bus: "bg-sand-100 text-brand" } as const;

  return (
    <section id={id} className={`scroll-mt-24 bg-surface max-sm:[&_th]:px-3 max-sm:[&_td]:px-3 max-sm:[&_th]:py-3 max-sm:[&_td]:py-3 max-sm:[&_th]:text-xs max-sm:[&_td_span]:px-2 max-sm:[&_td_span]:text-xs ${compact ? "py-10 sm:py-12 [&_td]:py-3 [&_th]:py-3" : "py-10 sm:px-4 sm:py-20"}`} aria-labelledby={`${id}-title`} data-testid="transfer-rates">
      <div className="container-page">
        <div className={compact ? "mb-6 text-center" : "mb-6 text-center sm:mb-12"}>
          <p className="eyebrow mb-4">{cfg.subtitle || t("subtitle")}</p>
          <h2 id={`${id}-title`} className="text-2xl text-heading sm:text-4xl md:text-5xl">
            {cfg.title || t("title")}
          </h2>
          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-gold-500" aria-hidden />
        </div>
        <RatesDisclosure enabled={collapsible && rows.length > 5} more={t("showMore")} less={t("showLess")}>
        <div role="region" aria-labelledby={`${id}-title`} tabIndex={0} className="overflow-x-auto rounded-xl sm:rounded-3xl border border-sand-200 shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
          <table className="min-w-full border-collapse bg-surface text-start">
            <thead>
              <tr className="bg-forest-900 text-[0.7rem] uppercase tracking-widest text-white">
                <th scope="col" className="px-6 py-5 text-start font-semibold">
                  {t("headers.destination")}
                </th>
                {columns.map((v) => (
                  <th key={v} scope="col" className="px-6 py-5 text-center font-semibold">
                    {t(`headers.${v}`).replace(/\s*\(USD\)/i, "")} <span className="font-normal text-gold-400">({currency})</span>
                  </th>
                ))}
                {showDuration && (
                  <th scope="col" className="px-6 py-5 text-start font-semibold">
                    {t("headers.duration")}
                  </th>
                )}
                {showDistance && (
                  <th scope="col" className="px-6 py-5 text-start font-semibold">
                    {t("headers.distance")}
                  </th>
                )}
              </tr>
            </thead>
            <tbody className="divide-y divide-sand-100">
              {rows.map((r, i) => (
                <tr key={`${r.destination}-${i}`} className="transition-colors hover:bg-sand-50">
                  <th scope="row" className="px-6 py-5 text-start font-display text-base font-semibold text-heading">
                    {r.destination}
                  </th>
                  {columns.map((v) => (
                    <td key={v} className="px-6 py-5 text-center">
                      {typeof r[v] === "number" ? (
                        <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ${pill[v]}`}>{formatPrice(r[v], currency, locale)}</span>
                      ) : (
                        <span className="text-muted">—</span>
                      )}
                    </td>
                  ))}
                  {showDuration && <td className="px-6 py-5 text-xs italic text-muted">{r.duration || "—"}</td>}
                  {showDistance && (
                    <td className="whitespace-nowrap px-6 py-5 text-sm font-medium text-ink">
                      {typeof r.distanceKm === "number" ? `${r.distanceKm} ${t("units.km")}` : "—"}
                    </td>
                  )}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        </RatesDisclosure>
        {cfg.note && <p className="mt-8 text-center text-[0.7rem] uppercase tracking-widest text-muted">{cfg.note}</p>}
      </div>
    </section>
  );
}
