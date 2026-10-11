"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Sticky in-page tab bar (Overview · Itinerary · Inclusions …) for long detail pages. Plain anchor links,
 * so it works without JavaScript; with JS the tab of the section in view is highlighted.
 */
export function SectionTabs({ tabs, label }: { tabs: { id: string; label: string }[]; label: string }) {
  const [active, setActive] = useState(tabs[0]?.id);

  useEffect(() => {
    const sections = tabs.map((t) => document.getElementById(t.id)).filter((el): el is HTMLElement => Boolean(el));
    if (!sections.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver(
      (entries) => {
        const visible = entries.filter((e) => e.isIntersecting).sort((a, b) => a.boundingClientRect.top - b.boundingClientRect.top)[0];
        if (visible) setActive(visible.target.id);
      },
      // A section counts as "current" while it crosses the band just below the sticky header + tab bar.
      { rootMargin: "-150px 0px -60% 0px" },
    );
    sections.forEach((s) => io.observe(s));
    return () => io.disconnect();
  }, [tabs]);

  if (tabs.length < 2) return null;
  return (
    <nav aria-label={label} className="sticky top-20 z-20 border-b border-sand-200 bg-sand-50/95 backdrop-blur">
      <ul className="container-page flex gap-2 overflow-x-auto py-3">
        {tabs.map((t) => (
          <li key={t.id} className="shrink-0">
            <a
              href={`#${t.id}`}
              aria-current={active === t.id ? "location" : undefined}
              className={cn(
                "block whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors",
                active === t.id ? "bg-forest-800 text-white" : "text-forest-800 hover:bg-forest-50",
              )}
            >
              {t.label}
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
