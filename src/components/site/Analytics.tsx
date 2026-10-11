"use client";

import { useEffect } from "react";
import { track, type AnalyticsEvent } from "@/lib/analytics";

/** Fires a page-view style event once when a detail page mounts (e.g. view_tour). */
export function TrackView({ event, itemId }: { event: Extract<AnalyticsEvent, "view_tour" | "view_vehicle">; itemId: string }) {
  useEffect(() => {
    track(event, { item_id: itemId });
  }, [event, itemId]);
  return null;
}

/**
 * One delegated listener for every WhatsApp link on the site (CMS buttons, floating button, footer …),
 * so each click is counted exactly once without wiring every link.
 */
export function WhatsAppClickTracker() {
  useEffect(() => {
    const onClick = (e: MouseEvent) => {
      const link = (e.target as Element | null)?.closest?.("a[href]");
      const href = link?.getAttribute("href") ?? "";
      if (!/^https:\/\/(wa\.me|api\.whatsapp\.com)\//i.test(href)) return;
      const location =
        link?.closest("[data-section]")?.getAttribute("data-section") ??
        (link?.closest("footer") ? "footer" : link?.closest("header") ? "header" : link?.getAttribute("data-testid") === "whatsapp-float" ? "float" : "page");
      track("whatsapp_click", { location });
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, []);
  return null;
}
