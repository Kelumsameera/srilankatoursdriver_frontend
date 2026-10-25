import { getTranslations } from "next-intl/server";
import type { SiteSettings } from "@/types/cms";

import { RatesDisclosure } from "./RatesDisclosure";
import { RatesTable } from "./RatesTable";

/**
 * "Tour Package Rates – Fixed rates from Airport (CMB)": the transfer price table managed in
 * Admin → Transfer Rates. Hidden when disabled or empty; vehicle columns without any price are dropped.
 */
export async function TransferRates({ settings, id = "rates", compact = false, collapsible = false }: { settings: SiteSettings | null; id?: string; compact?: boolean; collapsible?: boolean }) {
  const cfg = settings?.transferRates;
  const rows = (cfg?.rows ?? []).filter((r) => r.destination);
  if (!cfg || cfg.enabled === false || !rows.length) return null;
  const t = await getTranslations("rates");
  const currency = cfg.currency || settings?.currency || "USD";

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
          <RatesTable rows={rows} currency={currency} labelledBy={`${id}-title`} />
        </RatesDisclosure>
        {cfg.note && <p className="mt-8 text-center text-[0.7rem] uppercase tracking-widest text-muted">{cfg.note}</p>}
      </div>
    </section>
  );
}
