"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

const REVEAL = "[data-scroll-reveal]";
// Per-column scroll drift in px, the same layered look as the home page tour cards (HomeMotion)
const DRIFT = ["30", "-20", "12"];
// Per-column + per-row stagger (ms) for auto-tagged card grids; `--reveal-delay` can still override.
const COL_STEP_MS = 110;
const ROW_STEP_MS = 60;
const MAX_DELAY_MS = 640;

const staggerDelay = (index: number, perRow: number) =>
  Math.min((index % perRow) * COL_STEP_MS + Math.floor(index / perRow) * ROW_STEP_MS, MAX_DELAY_MS);

const perRowOf = (grid: HTMLElement) => Math.max(1, getComputedStyle(grid).gridTemplateColumns.split(" ").length);

/** Apply per-item stagger to a grid's children (auto-tagged grids). */
function staggerGrid(grid: HTMLElement) {
  const perRow = perRowOf(grid);
  [...grid.children].forEach((child, index) => {
    const card = child as HTMLElement;
    card.style.setProperty("--reveal-delay", `${staggerDelay(index, perRow)}ms`);
  });
}

/**
 * Gives every page the scroll-in 3D motion without tagging each page by hand. Inside <main>, every section after
 * the first (the hero stays put) gets it: card grids tip up card by card (data-scroll-reveal="3d"), other
 * sections rise in as a whole. Multi-column grids also get the home page parallax drift and mouse tilt.
 * Parts a page already tagged itself, or marked data-no-reveal, are left alone.
 * Runs only after the page has loaded and gone idle, so React has hydrated the server HTML first (changing
 * attributes before that causes a hydration mismatch). Sections are remembered in a WeakSet, not an attribute.
 */
function autoTag(seen: WeakSet<HTMLElement>, grids: Set<HTMLElement>) {
  const main = document.getElementById("main");
  if (!main) return;
  main.querySelectorAll<HTMLElement>("section").forEach((section) => {
    if (seen.has(section)) return;
    seen.add(section);
    const first = main.querySelector("section") === section || section.dataset.section === "hero";
    if (first || section.closest(`${REVEAL}, [data-no-reveal]`) || section.querySelector(REVEAL) || section.parentElement?.closest("section")) return;
    const top = section.getBoundingClientRect().top;
    if (top < window.innerHeight * 0.85) return; // already on screen at load: don't hide and replay it
    const found = [...section.querySelectorAll<HTMLElement>(".grid")].filter((grid) => grid.children.length >= 2 && !grid.parentElement?.closest(".grid"));
    if (found.length === 0) {
      section.setAttribute("data-scroll-reveal", "");
      return;
    }
    found.forEach((grid) => {
      const perRow = perRowOf(grid);
      [...grid.children].forEach((child, index) => {
        const card = child as HTMLElement;
        card.setAttribute("data-scroll-reveal", "3d");
        card.style.setProperty("--reveal-delay", `${staggerDelay(index, perRow)}ms`);
        if (perRow > 1) {
          // Each column drifts at its own speed while scrolling; mouse tilt on the card itself
          const inner = (card.firstElementChild as HTMLElement | null) ?? card;
          if (!inner.querySelector("[data-parallax]") && !inner.closest("[data-parallax]")) inner.setAttribute("data-parallax", DRIFT[index % perRow % DRIFT.length]);
          if (!card.querySelector("[data-depth-card]")) inner.setAttribute("data-depth-card", "");
        }
      });
      grids.add(grid);
    });
  });
}

/** Adds one lightweight observer for server-rendered sections. Content stays visible without JavaScript. */
export function ScrollReveal({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (!("IntersectionObserver" in window)) return;
    const observed = new WeakSet<HTMLElement>();
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      // Reveal a touch before the element fully enters, and once it's ~24px in.
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    const seen = new WeakSet<HTMLElement>();
    const grids = new Set<HTMLElement>();
    let autoReady = false;
    let resizeTimer = 0;
    const register = () => {
      if (autoReady && !motion.matches) autoTag(seen, grids);
      document.querySelectorAll<HTMLElement>("[data-scroll-reveal]:not(.is-visible)").forEach((target) => {
        // Per-element timing overrides (ms); otherwise `--reveal-delay` / `--reveal-duration` are left alone.
        const delay = target.getAttribute("data-reveal-delay");
        if (delay != null && delay !== "") target.style.setProperty("--reveal-delay", `${Number(delay) || 0}ms`);
        const duration = target.getAttribute("data-reveal-duration");
        if (duration != null && duration !== "") target.style.setProperty("--reveal-duration", `${Number(duration) || 900}ms`);
        if (motion.matches) target.classList.add("is-visible");
        else if (!observed.has(target)) {
          observed.add(target);
          observer.observe(target);
        }
      });
    };
    if (!motion.matches) document.documentElement.classList.add("motion-ready");
    register();
    // Start auto-tagging once the page has loaded and the browser is idle (hydration is finished by then)
    const idle = (cb: () => void) => (typeof window.requestIdleCallback === "function" ? window.requestIdleCallback(cb, { timeout: 1500 }) : setTimeout(cb, 300));
    let cancelled = false;
    const startAuto = () =>
      idle(() => {
        if (cancelled) return;
        autoReady = true;
        register();
      });
    if (document.readyState === "complete") startAuto();
    else window.addEventListener("load", startAuto, { once: true });
    // App Router may stream sections after the initial effect has run.
    const mutations = new MutationObserver(register);
    mutations.observe(document.body, { childList: true, subtree: true });
    // Column counts change across breakpoints: re-space auto-tagged grids.
    const onResize = () => {
      window.clearTimeout(resizeTimer);
      resizeTimer = window.setTimeout(() => {
        grids.forEach(staggerGrid);
        register();
      }, 150);
    };
    window.addEventListener("resize", onResize);
    const revealFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) {
        event.target.closest("[data-scroll-reveal]")?.classList.add("is-visible");
      }
    };
    document.addEventListener("focusin", revealFocus);
    const onMotionChange = () => {
      if (motion.matches) document.documentElement.classList.remove("motion-ready");
      else document.documentElement.classList.add("motion-ready");
      register();
    };
    motion.addEventListener("change", onMotionChange);
    return () => {
      cancelled = true;
      window.clearTimeout(resizeTimer);
      window.removeEventListener("load", startAuto);
      window.removeEventListener("resize", onResize);
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("focusin", revealFocus);
      motion.removeEventListener("change", onMotionChange);
      document.documentElement.classList.remove("motion-ready");
    };
  }, [pathname]);

  return children;
}
