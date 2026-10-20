"use client";

import { useState } from "react";
import { CheckCircle2, AlertTriangle, XCircle, MapPin } from "lucide-react";
import { googleFonts, googleFontsUrl, themeToCss, type ThemeSettings } from "@/lib/theme";
import { cn } from "@/lib/utils";

const SCOPE = { root: ".theme-preview", body: ".theme-preview" };

/**
 * Live preview of the unsaved theme: a small sample page styled with the same CSS the website will get,
 * scoped to this box. Custom CSS is not previewed (it targets the real site's markup).
 */
export function ThemePreview({ theme }: { theme: ThemeSettings }) {
  const [dark, setDark] = useState(false);
  const fontsUrl = googleFontsUrl(googleFonts(theme));
  const css = themeToCss(theme, SCOPE);

  return (
    <div>
      <div className="mb-2 flex items-center justify-between">
        <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">Live preview</p>
        <div className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 text-xs" role="radiogroup" aria-label="Preview mode">
          {(["Light", "Dark"] as const).map((m) => (
            <button
              key={m}
              type="button"
              role="radio"
              aria-checked={dark === (m === "Dark")}
              onClick={() => setDark(m === "Dark")}
              className={cn("rounded-md px-2.5 py-1 font-medium", dark === (m === "Dark") ? "bg-forest-800 text-white" : "text-slate-500")}
            >
              {m}
            </button>
          ))}
        </div>
      </div>
      {fontsUrl && <link rel="stylesheet" href={fontsUrl} />}
      <style dangerouslySetInnerHTML={{ __html: css }} />

      {/* Sample page: uses the website's own colour, font, radius and spacing utilities. */}
      <div className="theme-preview overflow-hidden rounded-xl border border-slate-200 bg-sand-50 font-sans text-ink shadow-sm" data-theme={dark ? "dark" : "light"}>
        <div className="flex items-center justify-between bg-forest-800 px-4 py-3 text-white">
          <span className="font-display text-lg">Sri Lanka Tours</span>
          <span className="rounded-full bg-gold-500 px-3 py-1 text-xs font-semibold text-forest-950">Book now</span>
        </div>

        <div className="space-y-4 p-5">
          <div>
            <p className="eyebrow">Private tours</p>
            <h1 className="mt-1 font-display text-h2 text-ink">Discover the island with your own driver</h1>
            <p className="mt-2 text-small text-muted">Tea country, ancient cities and golden beaches — planned around you.</p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button type="button" className="rounded-full bg-forest-800 px-4 py-2 text-sm font-medium text-white">
              Plan my trip
            </button>
            <button type="button" className="rounded-full border border-forest-600 px-4 py-2 text-sm font-medium text-forest-600">
              View tours
            </button>
          </div>

          <div className="rounded-2xl border border-line bg-surface p-4 shadow-card">
            <p className="flex items-center gap-1 text-xs text-muted">
              <MapPin className="h-3.5 w-3.5 text-gold-500" aria-hidden /> Ella · 3 days
            </p>
            <h3 className="mt-1 font-display text-h3 text-ink">Hill Country Escape</h3>
            <p className="mt-1 text-small text-muted">Nine Arches Bridge, Little Adam&apos;s Peak and a tea factory visit.</p>
            <p className="mt-2 text-sm font-semibold text-forest-600">From $240</p>
          </div>

          <div className="grid gap-2 text-xs">
            <p className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-success">
              <CheckCircle2 className="h-4 w-4" aria-hidden /> Booking request sent
            </p>
            <p className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-warning">
              <AlertTriangle className="h-4 w-4" aria-hidden /> Only 2 seats left
            </p>
            <p className="flex items-center gap-2 rounded-lg border border-line bg-surface px-3 py-2 text-danger">
              <XCircle className="h-4 w-4" aria-hidden /> Please enter your email
            </p>
          </div>

          <div className="space-y-1 border-t border-line pt-3 text-small">
            <p lang="si">ශ්‍රී ලංකාවේ සුන්දරත්වය ඔබේම රියදුරෙකු සමඟ</p>
            <p lang="ta">உங்கள் சொந்த ஓட்டுநருடன் இலங்கையின் அழகு</p>
          </div>
        </div>
      </div>
    </div>
  );
}
