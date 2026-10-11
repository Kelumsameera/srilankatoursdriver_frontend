"use client";

import { useEffect, type ReactNode } from "react";
import { usePathname } from "next/navigation";

/** Adds one lightweight observer for server-rendered sections. Content stays visible without JavaScript. */
export function ScrollReveal({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  useEffect(() => {
    const targets = document.querySelectorAll<HTMLElement>("[data-scroll-reveal]:not(.is-visible)");
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches || !("IntersectionObserver" in window)) {
      targets.forEach((target) => target.classList.add("is-visible"));
      return;
    }

    document.documentElement.classList.add("motion-ready");
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add("is-visible");
            observer.unobserve(entry.target);
          }
        });
      },
      { threshold: 0.08, rootMargin: "0px 0px -32px 0px" },
    );
    targets.forEach((target) => observer.observe(target));
    return () => observer.disconnect();
  }, [pathname]);

  return children;
}
