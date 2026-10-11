/**
 * Conversion events for a tag manager (GTM / GA4) – no provider is bundled with the site.
 * Events are pushed to `window.dataLayer` only when a tag manager has created it, so nothing is
 * sent anywhere until one is installed (with whatever consent handling it requires).
 *
 * Privacy: parameters are limited to the keys below – never names, e-mails, phone numbers or notes.
 */
export type AnalyticsEvent =
  | "view_tour"
  | "view_vehicle"
  | "start_trip_inquiry"
  | "submit_trip_inquiry"
  | "trip_inquiry_success"
  | "trip_inquiry_error"
  | "whatsapp_click";

export interface AnalyticsParams {
  /** Content slug, e.g. "05-days-down-south". */
  item_id?: string;
  /** Which form: "tailor_made" | "booking". */
  form?: string;
  /** Tailor-made step number (1-based). */
  step?: number;
  /** Failure category: "fields" | "rate_limited" | "network" | "generic". */
  error_type?: string;
  /** Where a link was clicked: page section type, "float", "footer" … */
  location?: string;
}

export function track(event: AnalyticsEvent, params: AnalyticsParams = {}) {
  if (typeof window === "undefined") return;
  const dataLayer = (window as Window & { dataLayer?: unknown[] }).dataLayer;
  if (!Array.isArray(dataLayer)) return;
  dataLayer.push({ event, ...params });
}
