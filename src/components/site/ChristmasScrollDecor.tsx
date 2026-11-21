"use client";

import { useEffect, useState } from "react";
import { RealisticChristmasSleigh } from "./RealisticChristmasSleigh";

/**
 * Christmas decorations that react to scrolling (on while Admin → Theme → snow animation is on).
 * - Marks each page section [data-lit] when it scrolls into view so the holly next to its heading pops in
 *   (CSS in globals.css, "Christmas" block).
 * - Santa's sleigh flies across the screen once the visitor scrolls past the hero.
 * - A gift box pops open in the corner while a booking call-to-action section is on screen.
 * Purely decorative: no clicks, and nothing moves for visitors who prefer reduced motion.
 */
export function ChristmasScrollDecor() {
  const [sleigh, setSleigh] = useState(false);
  const [gift, setGift] = useState(false);

  useEffect(() => {
    const reduced = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    // Holly: pops in once, the first time a section is a fifth into view.
    const lights = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (!e.isIntersecting) continue;
          e.target.setAttribute("data-lit", "");
          lights.unobserve(e.target);
        }
      },
      { threshold: 0.2 },
    );
    document.querySelectorAll("[data-section]").forEach((el) => lights.observe(el));

    // Gift box: visible while a CTA / tailor-made section is on screen.
    const ctas = new Set<Element>();
    const giftObserver = new IntersectionObserver(
      (entries) => {
        for (const e of entries) {
          if (e.isIntersecting) ctas.add(e.target);
          else ctas.delete(e.target);
        }
        setGift(ctas.size > 0);
      },
      { threshold: 0.3 },
    );
    document.querySelectorAll('[data-section="cta"], [data-section="tailorMade"]').forEach((el) => giftObserver.observe(el));

    // Sleigh: once per page, after scrolling past most of the first screen.
    let flown = false;
    const onScroll = () => {
      if (flown || reduced || window.scrollY < window.innerHeight * 0.7) return;
      flown = true;
      setSleigh(true);
      window.removeEventListener("scroll", onScroll);
    };
    window.addEventListener("scroll", onScroll, { passive: true });

    return () => {
      lights.disconnect();
      giftObserver.disconnect();
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  return (
    <div aria-hidden="true" className="pointer-events-none">
      {sleigh && (
        // Clipped to the viewport so the off-screen start/end of the flight never widens the page
        <div className="fixed inset-0 z-[55] overflow-hidden">
          <div
            className="xmas-sleigh absolute top-[18%] left-0 w-[300px] sm:w-[430px]"
            onAnimationEnd={(event) => {
              // Only the completed flight dismisses the team; the sprite also animates.
              if (event.target === event.currentTarget && event.animationName === "xmas-fly") {
                setSleigh(false);
              }
            }}
          >
            <RealisticChristmasSleigh />
          </div>
        </div>
      )}
      <GiftBox open={gift} />
    </div>
  );
}

/** Wrapped present above the currency button; the lid pops open with sparkles while a CTA is on screen. */
function GiftBox({ open }: { open: boolean }) {
  return (
    <div className={`xmas-gift fixed bottom-24 start-5 z-30 sm:bottom-28 sm:start-7 ${open ? "is-open" : ""}`}>
      <svg width="64" height="78" viewBox="0 0 64 78">
        <g className="xmas-gift-sparkles" fill="#fde68a">
          <path d="M14 10 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2 l5 -2z" />
          <path d="M48 4 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5 l4 -1.5z" />
          <circle cx="32" cy="8" r="2" />
        </g>
        {/* box */}
        <rect x="8" y="40" width="48" height="36" rx="3" fill="#c81e1e" />
        <rect x="28" y="40" width="8" height="36" fill="#e0b03c" />
        {/* lid + bow (lifts and tilts when open) */}
        <g className="xmas-gift-lid">
          <rect x="4" y="30" width="56" height="12" rx="3" fill="#dc2626" />
          <rect x="28" y="30" width="8" height="12" fill="#f0c24e" />
          <path d="M32 30 c-8 -12 -20 -8 -14 0z M32 30 c8 -12 20 -8 14 0z" fill="#e0b03c" stroke="#8a6414" strokeWidth="1" />
        </g>
      </svg>
    </div>
  );
}
