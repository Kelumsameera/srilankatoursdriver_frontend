"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

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
      { threshold: 0, rootMargin: "0px 0px -24px 0px" },
    );
    const register = () => {
      document.querySelectorAll<HTMLElement>("[data-scroll-reveal]:not(.is-visible)").forEach((target) => {
        if (motion.matches) target.classList.add("is-visible");
        else if (!observed.has(target)) {
          observed.add(target);
          observer.observe(target);
        }
      });
    };
    if (!motion.matches) document.documentElement.classList.add("motion-ready");
    register();
    // App Router may stream sections after the initial effect has run.
    const mutations = new MutationObserver(register);
    mutations.observe(document.body, { childList: true, subtree: true });
    const revealFocus = (event: FocusEvent) => {
      if (event.target instanceof Element) {
        event.target.closest("[data-scroll-reveal]")?.classList.add("is-visible");
      }
    };
    document.addEventListener("focusin", revealFocus);
    motion.addEventListener("change", register);
    return () => {
      observer.disconnect();
      mutations.disconnect();
      document.removeEventListener("focusin", revealFocus);
      motion.removeEventListener("change", register);
      document.documentElement.classList.remove("motion-ready");
    };
  }, [pathname]);

  return children;
}
