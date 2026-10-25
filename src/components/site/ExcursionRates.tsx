import { getTranslations } from "next-intl/server";
import type { Excursion, SiteSettings } from "@/types/cms";
import { findRateTable } from "@/lib/rate-origin";

import { RatesDisclosure } from "./RatesDisclosure";
import { RatesOriginPicker } from "./RatesOriginPicker";
import { RatesTable } from "./RatesTable";

/**
 * "Transfers from <origin>" price tables, managed in Admin → Rates.
 * With an excursion: only the table that starts at that excursion's place (excursion detail page).
 * Without: visitors pick a starting point. Hidden when disabled or there is no table to show.
 */
export async function ExcursionRates({ settings, excursion, id = "excursion-rates" }: { settings: SiteSettings | null; excursion?: Excursion; id?: string }) {
  const cfg = settings?.excursionRates;
  const tables = (cfg?.tables ?? [])
    .map((tbl) => ({ origin: tbl.origin, rows: (tbl.rows ?? []).filter((r) => r.destination) }))
    .filter((tbl) => tbl.origin && tbl.rows.length);
  const match = excursion ? findRateTable(tables, excursion) : undefined;
  if (excursion && !match) return null;
  if (!cfg || cfg.enabled === false || !tables.length) return null;
  const t = await getTranslations("rates");
  const currency = cfg.currency || "LKR";

  return (
    <section id={id} className="scroll-mt-24 bg-surface py-10 sm:px-4 sm:py-20 max-sm:[&_th]:px-3 max-sm:[&_td]:px-3 max-sm:[&_th]:py-3 max-sm:[&_td]:py-3 max-sm:[&_th]:text-xs max-sm:[&_td_span]:px-2 max-sm:[&_td_span]:text-xs" aria-labelledby={`${id}-title`} data-testid="excursion-rates">
      <div className="container-page">
        <div className="mb-6 text-center sm:mb-10">
          <p className="eyebrow mb-4">{cfg.subtitle || t("excursionSubtitle")}</p>
          <h2 id={`${id}-title`} className="text-2xl text-heading sm:text-4xl md:text-5xl">
            {cfg.title || t("excursionTitle")}
          </h2>
          <div className="mx-auto mt-6 h-1 w-20 rounded-full bg-gold-500" aria-hidden />
        </div>
        {match ? (
          <>
            <h3 className="mb-5 text-xl text-heading">
              {t("transfersFrom")} {excursion?.title}
            </h3>
            <RatesTable rows={match.rows} currency={currency} labelledBy={`${id}-title`} />
          </>
        ) : (
          <RatesOriginPicker origins={tables.map((tbl) => tbl.origin)} label={t("startingPoint")} heading={t("transfersFrom")}>
            {tables.map((tbl) => (
              <RatesDisclosure key={tbl.origin} enabled={tbl.rows.length > 5} more={t("showMore")} less={t("showLess")}>
                <RatesTable rows={tbl.rows} currency={currency} labelledBy={`${id}-title`} />
              </RatesDisclosure>
            ))}
          </RatesOriginPicker>
        )}
        {cfg.note && <p className="mx-auto mt-8 max-w-3xl text-center text-xs text-muted">{cfg.note}</p>}
      </div>
    </section>
  );
}
