"use client";

import { useEffect, useId, useRef, useState } from "react";
import { useLocale, useTranslations } from "next-intl";
import { ArrowDownUp, Coins, Loader2, X } from "lucide-react";
import { CURRENCIES, LOCALE_CURRENCY, convert } from "@/lib/currency";
import { cn } from "@/lib/utils";

interface Rates {
  base: string;
  rates: Record<string, number>;
  updatedAt: string | null;
}

function currencyName(locale: string, code: string) {
  try {
    return new Intl.DisplayNames([locale], { type: "currency" }).of(code) ?? code;
  } catch {
    return code;
  }
}

/** Floating currency converter (bottom-start; the WhatsApp button sits bottom-end). Rates load on first open. */
export function CurrencyConverter({ siteCurrency = "USD" }: { siteCurrency?: string }) {
  const t = useTranslations("currency");
  const tc = useTranslations("common");
  const locale = useLocale();
  const id = useId();
  const [open, setOpen] = useState(false);
  const [rates, setRates] = useState<Rates | null>(null);
  const [state, setState] = useState<"idle" | "loading" | "error">("idle");
  const [amount, setAmount] = useState("100");
  const from0 = (CURRENCIES as readonly string[]).includes(siteCurrency) ? siteCurrency : "USD";
  const [from, setFrom] = useState(from0);
  const [to, setTo] = useState(() => {
    const guess = LOCALE_CURRENCY[locale] ?? "EUR";
    return guess === from0 ? (from0 === "USD" ? "EUR" : "USD") : guess;
  });
  const toggle = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);

  // Load once when first opened; after a failure, closing and reopening retries.
  const inFlight = useRef(false);
  useEffect(() => {
    if (!open || rates || inFlight.current) return;
    inFlight.current = true;
    setState("loading");
    fetch("/api/currency?base=USD")
      .then((r) => r.json())
      .then((json: { success: boolean; data?: Rates }) => {
        if (json.success && json.data) {
          setRates(json.data);
          setState("idle");
        } else setState("error");
      })
      .catch(() => setState("error"))
      .finally(() => {
        inFlight.current = false;
      });
  }, [open, rates]);

  useEffect(() => {
    if (!open) return;
    panel.current?.querySelector<HTMLInputElement>("input")?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== "Escape") return;
      setOpen(false);
      toggle.current?.focus();
    };
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [open]);

  const names = (c: string) => currencyName(locale, c);

  const value = Number(amount.replace(",", "."));
  const result = rates ? convert(value, from, to, rates.base, rates.rates) : null;
  const fmt = (n: number, c: string) => {
    try {
      return new Intl.NumberFormat(locale, { style: "currency", currency: c, maximumFractionDigits: n >= 100 ? 0 : 2 }).format(n);
    } catch {
      return `${n.toFixed(2)} ${c}`;
    }
  };
  const updated = rates?.updatedAt ? new Intl.DateTimeFormat(locale, { dateStyle: "medium" }).format(new Date(rates.updatedAt)) : null;
  const select = "w-full rounded-xl border border-sand-200 bg-white px-3 py-2.5 text-sm text-ink focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20";

  return (
    <div className="fixed bottom-5 start-5 z-40 sm:bottom-7 sm:start-7">
      {open && (
        <div
          ref={panel}
          id={`${id}-panel`}
          role="dialog"
          aria-labelledby={`${id}-title`}
          className="absolute bottom-16 start-0 w-[min(20rem,calc(100vw-2.5rem))] rounded-3xl border border-sand-200 bg-white p-5 shadow-card"
          data-testid="currency-converter"
        >
          <div className="mb-4 flex items-center justify-between">
            <h2 id={`${id}-title`} className="font-sans text-base font-semibold text-forest-900">
              {t("title")}
            </h2>
            <button type="button" onClick={() => setOpen(false)} className="rounded-full p-1 text-muted hover:bg-sand-100" aria-label={tc("close")}>
              <X className="h-4 w-4" />
            </button>
          </div>
          <label htmlFor={`${id}-amount`} className="mb-1 block text-xs font-medium text-muted">
            {t("amount")}
          </label>
          <input
            id={`${id}-amount`}
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value.replace(/[^\d.,]/g, ""))}
            className={cn(select, "mb-3 text-lg font-semibold")}
          />
          <div className="flex items-end gap-2">
            <div className="flex-1">
              <label htmlFor={`${id}-from`} className="mb-1 block text-xs font-medium text-muted">
                {t("from")}
              </label>
              <select id={`${id}-from`} value={from} onChange={(e) => setFrom(e.target.value)} className={select}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} title={names(c)}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
            <button
              type="button"
              onClick={() => (setFrom(to), setTo(from))}
              className="mb-1 rounded-full border border-sand-200 p-2 text-forest-700 hover:border-forest-600"
              aria-label={t("swap")}
              title={t("swap")}
            >
              <ArrowDownUp className="h-4 w-4 rotate-90" />
            </button>
            <div className="flex-1">
              <label htmlFor={`${id}-to`} className="mb-1 block text-xs font-medium text-muted">
                {t("to")}
              </label>
              <select id={`${id}-to`} value={to} onChange={(e) => setTo(e.target.value)} className={select}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c} title={names(c)}>
                    {c}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="mt-4 rounded-2xl bg-forest-50 p-4" aria-live="polite">
            {state === "loading" && !rates ? (
              <Loader2 className="mx-auto h-5 w-5 animate-spin text-forest-600" aria-label={tc("loading")} />
            ) : state === "error" ? (
              <p className="text-sm text-earth-700">{t("error")}</p>
            ) : result !== null && value > 0 ? (
              <>
                <p className="text-xs text-muted">
                  {fmt(value, from)} =
                </p>
                <p className="font-display text-2xl text-forest-900">{fmt(result, to)}</p>
                <p className="mt-1 text-xs text-muted">{names(to)}</p>
              </>
            ) : (
              <p className="text-sm text-muted">—</p>
            )}
          </div>
          <p className="mt-3 text-[11px] leading-snug text-muted">
            {updated && <>{t("updated", { date: updated })}. </>}
            {t("note", { currency: siteCurrency })}
          </p>
        </div>
      )}
      <button
        ref={toggle}
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        aria-controls={`${id}-panel`}
        aria-label={t("title")}
        title={t("title")}
        data-testid="currency-toggle"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-forest-800 text-gold-400 shadow-card transition-transform hover:scale-105"
      >
        {open ? <X className="h-6 w-6" /> : <Coins className="h-6 w-6" />}
      </button>
    </div>
  );
}
