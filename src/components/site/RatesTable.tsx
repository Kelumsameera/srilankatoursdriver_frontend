import { getLocale, getTranslations } from "next-intl/server";
import type { TransferRate } from "@/types/cms";
import { formatPrice } from "@/lib/utils";

const VEHICLES = ["car", "van", "bus"] as const;
const PILL = { car: "bg-forest-50 text-brand-soft", van: "bg-gold-100 text-earth-700", bus: "bg-sand-100 text-brand" } as const;

/** Destination → car / van / bus price table; vehicle, duration and distance columns without any value are dropped. */
export async function RatesTable({ rows, currency, labelledBy }: { rows: TransferRate[]; currency: string; labelledBy: string }) {
  const [t, locale] = await Promise.all([getTranslations("rates"), getLocale()]);
  const columns = VEHICLES.filter((v) => rows.some((r) => typeof r[v] === "number"));
  const showDuration = rows.some((r) => r.duration);
  const showDistance = rows.some((r) => typeof r.distanceKm === "number");

  return (
    <div role="region" aria-labelledby={labelledBy} tabIndex={0} className="overflow-x-auto rounded-xl sm:rounded-3xl border border-sand-200 shadow-card focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-brand">
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
                    <span className={`inline-block whitespace-nowrap rounded-full px-3 py-1 text-sm font-bold ${PILL[v]}`}>{formatPrice(r[v], currency, locale)}</span>
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
  );
}
