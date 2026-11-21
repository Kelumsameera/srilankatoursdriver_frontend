"use client";

import { useEffect, useState } from "react";

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
      {sleigh && <Sleigh onDone={() => setSleigh(false)} />}
      <GiftBox open={gift} />
    </div>
  );
}

/** Santa, sleigh and two reindeer flying left to right across the upper part of the screen. */
function Sleigh({ onDone }: { onDone: () => void }) {
  return (
    <svg className="xmas-sleigh fixed top-[18%] left-0 z-[55] w-[220px] sm:w-[300px]" viewBox="0 0 300 90" onAnimationEnd={onDone}>
      {/* sparkle trail */}
      <g fill="#fde68a">
        <circle cx="4" cy="62" r="1.6" />
        <circle cx="16" cy="56" r="1.2" />
        <circle cx="28" cy="64" r="1.8" />
        <circle cx="40" cy="58" r="1" />
      </g>
      {/* reins */}
      <path d="M118 52 Q170 40 205 42 M118 52 Q200 50 255 36" stroke="#8a6414" strokeWidth="1.2" fill="none" />
      {/* sleigh */}
      <path d="M50 46 h62 q10 0 10 12 v6 h-66 q-12 0 -12 -10z" fill="#c81e1e" stroke="#7f1d1d" strokeWidth="1.2" />
      <path d="M42 72 h80 q10 0 12 -8" stroke="#d4a537" strokeWidth="3" fill="none" strokeLinecap="round" />
      <path d="M60 64 v8 M108 64 v8" stroke="#d4a537" strokeWidth="2.5" />
      {/* gift sack */}
      <ellipse cx="62" cy="40" rx="13" ry="12" fill="#7c4a1e" />
      <rect x="54" y="26" width="10" height="9" fill="#1f8a4c" />
      <rect x="64" y="24" width="9" height="11" fill="#e0b03c" />
      {/* Santa */}
      <circle cx="95" cy="34" r="10" fill="#c81e1e" />
      <circle cx="98" cy="22" r="6" fill="#f5cba7" />
      <path d="M92 24 q6 10 12 0 q-2 8 -6 9 q-4 -1 -6 -9z" fill="#fff" />
      <path d="M92 19 q6 -12 14 -4 l-14 4z" fill="#c81e1e" />
      <circle cx="107" cy="14" r="2.4" fill="#fff" />
      <rect x="86" y="36" width="18" height="3" fill="#1c1917" />
      {/* reindeer */}
      <Reindeer x={190} />
      <Reindeer x={240} nose="#ef4444" />
    </svg>
  );
}

function Reindeer({ x, nose = "#3f2a1a" }: { x: number; nose?: string }) {
  return (
    <g transform={`translate(${x} 0)`}>
      <ellipse cx="18" cy="44" rx="18" ry="8" fill="#8b5a2b" />
      <path d="M4 48 l-8 12 M10 50 l-2 14 M28 50 l6 12 M32 47 l12 8" stroke="#5c3a1a" strokeWidth="3" strokeLinecap="round" />
      <path d="M30 40 q6 -10 12 -12" stroke="#8b5a2b" strokeWidth="6" strokeLinecap="round" fill="none" />
      <ellipse cx="46" cy="27" rx="7" ry="5" fill="#8b5a2b" />
      <circle cx="53" cy="27" r="2.4" fill={nose} />
      <path d="M42 22 l-4 -10 m2 5 l-5 -2 M46 22 l2 -10 m-1 5 l4 -3" stroke="#5c3a1a" strokeWidth="1.6" strokeLinecap="round" fill="none" />
    </g>
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
