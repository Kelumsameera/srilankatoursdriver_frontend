/** Currencies offered in the converter – the ones Sri Lanka's visitors most often pay in. */
export const CURRENCIES = [
  "USD", "EUR", "GBP", "LKR", "AUD", "CAD", "CHF", "INR", "JPY", "CNY", "KRW", "RUB",
  "AED", "SAR", "SGD", "HKD", "NZD", "SEK", "NOK", "DKK", "PLN", "CZK", "THB", "MYR", "BRL", "ZAR",
] as const;

/** A sensible "to" currency for each UI language (the visitor's likely home currency). */
export const LOCALE_CURRENCY: Record<string, string> = {
  en: "GBP",
  si: "LKR",
  ta: "LKR",
  de: "EUR",
  fr: "EUR",
  es: "EUR",
  it: "EUR",
  pt: "EUR",
  zh: "CNY",
  ja: "JPY",
  ko: "KRW",
  ru: "RUB",
  ar: "AED",
  hi: "INR",
};

/** Converts with rates quoted against `base` (rates[base] === 1). Returns null when a rate is missing. */
export function convert(amount: number, from: string, to: string, base: string, rates: Record<string, number>): number | null {
  const rFrom = from === base ? 1 : rates[from];
  const rTo = to === base ? 1 : rates[to];
  if (!rFrom || !rTo || !Number.isFinite(amount)) return null;
  return (amount / rFrom) * rTo;
}
