"use client";

import { useEffect, useRef, type ReactNode } from "react";
import { parallaxOffset, pointerTilt } from "@/lib/home-motion";

/** Progressive enhancement: native scrolling, with one shared animation frame for visible layers. */
export function HomeMotion({ children }: { children: ReactNode }) {
  const root = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const host = root.current;
    if (!host || !("IntersectionObserver" in window)) return;
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)");
    const finePointer = window.matchMedia("(hover: hover) and (pointer: fine)");
    const wideScreen = window.matchMedia("(min-width: 768px)");
    const visible = new Set<HTMLElement>();
    const registered = new Set<HTMLElement>();
    let frame = 0;
    let card: HTMLElement | null = null;
    let pointer: { x: number; y: number } | null = null;
    const resetCard = () => {
      card?.style.removeProperty("--tilt-x");
      card?.style.removeProperty("--tilt-y");
      card?.style.removeProperty("transform");
      card?.style.removeProperty("box-shadow");
      card?.style.removeProperty("transition");
      card = null;
      pointer = null;
    };
    const paint = () => {
      frame = 0;
      if (reduced.matches) return;
      const layers = wideScreen.matches ? [...visible].map((element) => ({
        element, rect: element.getBoundingClientRect(), strength: Number(element.dataset.parallax),
        currentOffset: parseFloat(element.style.getPropertyValue("--parallax-y")) || 0,
      })) : [];
      const tilt = card && pointer ? pointerTilt(pointer.x, pointer.y, card.getBoundingClientRect()) : null;
      layers.forEach(({ element, rect, strength, currentOffset }) => {
        const offset = parallaxOffset(rect.top - currentOffset, rect.height, window.innerHeight, strength);
        element.style.setProperty("--parallax-y", `${offset}px`);
        // Individual translate preserves the photo's existing collage rotation.
        element.style.translate = `0 ${offset}px`;
      });
      if (card && tilt) {
        card.style.setProperty("--tilt-x", `${tilt.x}deg`);
        card.style.setProperty("--tilt-y", `${tilt.y}deg`);
        card.style.transform = `perspective(1100px) rotateX(${tilt.x}deg) rotateY(${tilt.y}deg) translateY(-6px)`;
        card.style.transition = "transform 240ms ease-out, box-shadow 350ms ease";
        card.style.boxShadow = "0 28px 50px -24px rgb(8 38 26 / 0.38)";
      }
    };
    const schedule = () => {
      if (!frame && !reduced.matches) frame = requestAnimationFrame(paint);
    };
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const element = entry.target as HTMLElement;
        if (entry.isIntersecting) visible.add(element);
        else visible.delete(element);
      });
      schedule();
    }, { rootMargin: "100px" });
    const register = () => {
      host.querySelectorAll<HTMLElement>("[data-parallax]").forEach((element) => {
        if (!registered.has(element)) {
          registered.add(element);
          observer.observe(element);
        }
      });
    };
    const move = (event: PointerEvent) => {
      if (reduced.matches || !finePointer.matches || event.pointerType !== "mouse") return;
      const target = event.target instanceof Element ? event.target.closest<HTMLElement>("[data-depth-card]") : null;
      if (target !== card) resetCard();
      card = target;
      pointer = target ? { x: event.clientX, y: event.clientY } : null;
      if (card) schedule();
    };
    const preferencesChanged = () => {
      resetCard();
      if (reduced.matches || !wideScreen.matches) registered.forEach((element) => {
        element.style.removeProperty("--parallax-y");
        element.style.removeProperty("translate");
      });
      else schedule();
    };
    register();
    const mutations = new MutationObserver(register);
    mutations.observe(host, { subtree: true, childList: true });
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", schedule);
    host.addEventListener("pointermove", move, { passive: true });
    host.addEventListener("pointerleave", resetCard);
    reduced.addEventListener("change", preferencesChanged);
    finePointer.addEventListener("change", preferencesChanged);
    wideScreen.addEventListener("change", preferencesChanged);
    return () => {
      cancelAnimationFrame(frame);
      observer.disconnect();
      mutations.disconnect();
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", schedule);
      host.removeEventListener("pointermove", move);
      host.removeEventListener("pointerleave", resetCard);
      reduced.removeEventListener("change", preferencesChanged);
      finePointer.removeEventListener("change", preferencesChanged);
      wideScreen.removeEventListener("change", preferencesChanged);
      resetCard();
      registered.forEach((element) => {
        element.style.removeProperty("--parallax-y");
        element.style.removeProperty("translate");
      });
    };
  }, []);
  return <div ref={root} className="home-motion">{children}</div>;
}
