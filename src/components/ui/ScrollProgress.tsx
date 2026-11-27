"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

const clamp01 = (n: number) => (n < 0 ? 0 : n > 1 ? 1 : n);

/**
 * Scroll animations on top of the reveal system:
 * - a thin reading-progress bar pinned to the top of the viewport;
 * - `--scroll-progress` (0 → 1) written on <html> for the whole page (`--page-scroll-progress` too);
 * - `--scroll-progress` written on every `[data-scroll-progress]` element for its own travel through the
 *   viewport (0 as it enters at the bottom, 1 as it leaves at the top) — drive CSS from it, e.g.
 *   `opacity: var(--scroll-progress)` or the `.scroll-fade-in` / `.scroll-scale` / `.scroll-shift-y` helpers.
 *
 * One rAF-throttled passive scroll listener, one resize listener, and a MutationObserver for elements
 * streamed in later. Entirely disabled for `prefers-reduced-motion: reduce`; the bar is hidden then.
 * Scroll position is read, never set — it layers on top of smooth scrolling (Lenis) without conflict.
 */
export function ScrollProgress() {
  const pathname = usePathname();
  const bar = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const root = document.documentElement;
    const barEl = bar.current;

    let frame = 0;
    let targets: HTMLElement[] = [];

    const collect = () => {
      targets = [...document.querySelectorAll<HTMLElement>("[data-scroll-progress]")];
    };

    const clear = () => {
      root.style.removeProperty("--scroll-progress");
      root.style.removeProperty("--page-scroll-progress");
      targets.forEach((el) => el.style.removeProperty("--scroll-progress"));
      if (barEl) {
        barEl.style.removeProperty("--scroll-progress");
        barEl.style.transform = "";
      }
    };

    const paint = () => {
      frame = 0;
      if (reduced.matches) return;
      const viewport = window.innerHeight || 1;
      const scrollY = window.scrollY || root.scrollTop || 0;
      const pageMax = Math.max(0, root.scrollHeight - viewport);
      const page = clamp01(pageMax > 0 ? scrollY / pageMax : 0);

      root.style.setProperty("--scroll-progress", page.toFixed(4));
      root.style.setProperty("--page-scroll-progress", page.toFixed(4));
      if (barEl) {
        barEl.style.setProperty("--scroll-progress", page.toFixed(4));
        barEl.style.transform = `scaleX(${page.toFixed(4)})`;
      }

      for (const el of targets) {
        const rect = el.getBoundingClientRect();
        // 0 as the element's top enters at the bottom of the viewport, 1 as its bottom leaves at the top.
        const progress = clamp01((viewport - rect.top) / ((viewport + rect.height) || 1));
        el.style.setProperty("--scroll-progress", progress.toFixed(4));
      }
    };

    const schedule = () => {
      if (!frame && !reduced.matches) frame = requestAnimationFrame(paint);
    };

    const rescan = () => {
      collect();
      schedule();
    };

    const onPreferenceChange = () => {
      if (reduced.matches) clear();
      else rescan();
    };

    collect();
    schedule();

    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", rescan);
    // App Router streams sections in after the first paint.
    const mutations = new MutationObserver(rescan);
    mutations.observe(document.body, { childList: true, subtree: true });
    reduced.addEventListener("change", onPreferenceChange);

    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", rescan);
      mutations.disconnect();
      reduced.removeEventListener("change", onPreferenceChange);
      clear();
    };
  }, [pathname]);

  return (
    <div className="scroll-progress motion-reduce:hidden" aria-hidden="true" role="presentation">
      <span ref={bar} className="scroll-progress-bar" />
    </div>
  );
}
