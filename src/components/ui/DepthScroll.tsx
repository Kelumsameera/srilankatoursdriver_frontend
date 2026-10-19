// "use client": smooth scrolling and the moving card photos need the browser (scroll position, animation frames)
"use client";

import { useEffect } from "react";
import { usePathname } from "next/navigation";
import Lenis from "lenis";
import "lenis/dist/lenis.css";

// How far a card photo moves inside its frame, as a share of the frame height (CSS scales the photo up to make room).
const DEPTH = 0.06;

/**
 * 3D depth while scrolling, like walkerstours.com:
 * - smooth, gliding mouse-wheel scrolling (Lenis) on desktop
 * - card photos ([data-depth-img], see CmsImage `depth`) drift inside their frames, slower than the page,
 *   so the photo looks further away than the card.
 * Off for "reduce motion" users. Touch phones keep native scrolling; the photo drift still runs there.
 */
export function DepthScroll() {
  const pathname = usePathname();

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (reduced.matches || !("IntersectionObserver" in window)) return;

    // SMOOTH SCROLL: only with a mouse/trackpad; nested scroll boxes (menus, dropdowns) keep scrolling themselves
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)").matches;
    const lenis = finePointer ? new Lenis({ autoRaf: true, lerp: 0.1, allowNestedScroll: true }) : null;

    // The mobile menu and the gallery lightbox lock the page with body overflow hidden: pause smooth scroll then
    const lockWatcher = new MutationObserver(() => {
      if (document.body.style.overflow === "hidden") lenis?.stop();
      else lenis?.start();
    });
    if (lenis) lockWatcher.observe(document.body, { attributes: true, attributeFilter: ["style"] });

    // PHOTO DRIFT: move only the photos that are on screen, once per animation frame
    const visible = new Set<HTMLElement>();
    let frame = 0;
    const paint = () => {
      frame = 0;
      const viewport = window.innerHeight;
      visible.forEach((frameEl) => {
        const rect = frameEl.getBoundingClientRect();
        // -1 when the frame enters at the bottom, 0 in the middle of the screen, 1 when it leaves at the top
        const progress = Math.max(-1, Math.min(1, (viewport / 2 - rect.top - rect.height / 2) / ((viewport + rect.height) / 2)));
        frameEl.style.setProperty("--depth-y", `${(progress * DEPTH * rect.height).toFixed(1)}px`);
      });
    };
    const schedule = () => {
      if (!frame) frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const el = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(el);
        else visible.delete(el);
      });
      schedule();
    }, { rootMargin: "100px" });
    const observed = new WeakSet<HTMLElement>();
    const register = () => {
      document.querySelectorAll<HTMLElement>("[data-depth-img]").forEach((el) => {
        if (!observed.has(el)) {
          observed.add(el);
          observer.observe(el);
        }
      });
    };
    register();
    // Sections can stream in after the first render
    const mutations = new MutationObserver(register);
    mutations.observe(document.body, { childList: true, subtree: true });
    document.documentElement.classList.add("depth-ready");
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);

    return () => {
      cancelAnimationFrame(frame);
      lenis?.destroy();
      lockWatcher.disconnect();
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      document.documentElement.classList.remove("depth-ready");
    };
  }, [pathname]);

  return null;
}
