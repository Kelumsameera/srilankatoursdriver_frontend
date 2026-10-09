"use client";

import { useEffect, useRef } from "react";
import { useLocale } from "next-intl";
import { usePathname } from "@/i18n/navigation";
import { API_URL } from "@/lib/config";

const SESSION_KEY = "sltd_sid";

/** Random id for this tab's visit. sessionStorage only – it ends with the tab and is never a cookie. */
function sessionId(): { id: string; isNew: boolean } {
  try {
    const existing = sessionStorage.getItem(SESSION_KEY);
    if (existing) return { id: existing, isNew: false };
    const id = typeof crypto !== "undefined" && "randomUUID" in crypto ? crypto.randomUUID() : `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 12)}`;
    sessionStorage.setItem(SESSION_KEY, id);
    return { id, isNew: true };
  } catch {
    return { id: `ephemeral-${Math.random().toString(36).slice(2, 12)}`, isNew: true };
  }
}

/**
 * Cookieless, first-party page-view analytics for Admin → Analytics. Sends the path (never the query
 * string), locale and – on the first view of a visit – where the visitor came from. Honours Do Not Track
 * and Global Privacy Control, and skips preview pages.
 */
export function PageViewTracker() {
  const pathname = usePathname();
  const locale = useLocale();
  const last = useRef<string | null>(null);

  useEffect(() => {
    if (!pathname || pathname === last.current || pathname.startsWith("/preview")) return;
    last.current = pathname;
    const nav = navigator as Navigator & { globalPrivacyControl?: boolean };
    if (nav.doNotTrack === "1" || nav.globalPrivacyControl) return;

    const { id, isNew } = sessionId();
    const utmSource = isNew ? (new URLSearchParams(window.location.search).get("utm_source") ?? undefined) : undefined;
    void fetch(`${API_URL}/track`, {
      method: "POST",
      keepalive: true,
      credentials: "omit",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        path: pathname,
        locale,
        session: id,
        entry: isNew,
        referrer: isNew && document.referrer ? document.referrer : undefined,
        utmSource: utmSource?.slice(0, 80) || undefined,
      }),
    }).catch(() => undefined);
  }, [pathname, locale]);

  return null;
}
