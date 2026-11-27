import type { CSSProperties } from "react";

/**
 * Scroll-reveal props (see `ScrollReveal.tsx` + the `[data-scroll-reveal]` rules in globals.css).
 *
 * `data-scroll-reveal` marks an element; once it scrolls into view the `ScrollReveal` observer adds
 * `.is-visible`. Without JavaScript (or with reduced motion) the element stays visible.
 */

/** Reveal styles. `rise` is the default; `3d` tips a card up; `clip`/`mask` wipe; `left`/`right` slide; … */
export type RevealVariant =
  | "rise" // slide up + slight tilt (default)
  | "fade" // opacity only
  | "drop" // slide down
  | "left" // slide in from the left
  | "right" // slide in from the right
  | "scale" // grow from 94%
  | "zoom" // shrink from 106%
  | "blur" // un-blur + slide up
  | "flip" // 3D flip in on the Y axis
  | "swing" // small 3D swing in
  | "clip" // wipe in from the inline-start edge
  | "mask" // wipe in from the bottom (text/section reveal)
  | "3d"; // card tips up from lying back

export const REVEAL_VARIANTS: readonly RevealVariant[] = [
  "rise",
  "fade",
  "drop",
  "left",
  "right",
  "scale",
  "zoom",
  "blur",
  "flip",
  "swing",
  "clip",
  "mask",
  "3d",
];

/** Per-column stagger between cards in the same row, in ms. */
export const REVEAL_STEP_MS = 110;
/** Extra per-row offset so rows cascade, in ms (capped so long lists don't drift forever). */
export const REVEAL_ROW_MS = 60;
/** Never delay a card by more than this, so long grids reveal promptly. */
export const REVEAL_MAX_DELAY_MS = 640;

export interface RevealOptions {
  /** Item position in a list/grid; drives the stagger. */
  index?: number;
  /** Number of cards in a row; the stagger resets each row. Defaults to 3. */
  perRow?: number;
  /** Per-column stagger in ms. Defaults to `REVEAL_STEP_MS`. */
  step?: number;
  /** Per-row stagger in ms. Defaults to `REVEAL_ROW_MS`. */
  rowStep?: number;
  /** Delay before any stagger, in ms. */
  baseDelay?: number;
  /** Transition duration in ms → `--reveal-duration`. */
  duration?: number;
  /** Slide distance → `--reveal-distance` (any CSS length). */
  distance?: string;
}

const clampInt = (n: number, min = 0) => (Number.isFinite(n) ? Math.max(min, Math.floor(n)) : min);

/**
 * Staggered start delay in ms for item `index` in a grid `perRow` cards wide:
 * cards in a row cascade, each row starts a touch after the one above, and the total is capped.
 */
export function staggerDelay(
  index: number,
  perRow = 3,
  step = REVEAL_STEP_MS,
  rowStep = REVEAL_ROW_MS,
  baseDelay = 0,
) {
  const safePerRow = Math.max(1, clampInt(perRow, 1) || 1);
  const i = clampInt(index);
  const col = i % safePerRow;
  const row = Math.floor(i / safePerRow);
  const delay = baseDelay + col * step + row * rowStep;
  return Math.round(Math.min(delay, baseDelay + REVEAL_MAX_DELAY_MS));
}

/** Build `data-scroll-reveal` props (variant + timing CSS vars) for one element. */
export function reveal(variant: RevealVariant = "rise", options: RevealOptions = {}) {
  const { index, perRow = 3, step, rowStep, baseDelay, duration, distance } = options;
  const style: CSSProperties & Record<string, string> = {};
  if (index != null) {
    style["--reveal-delay"] = `${staggerDelay(index, perRow, step ?? REVEAL_STEP_MS, rowStep ?? REVEAL_ROW_MS, baseDelay ?? 0)}ms`;
  } else if (baseDelay != null) {
    style["--reveal-delay"] = `${Math.round(baseDelay)}ms`;
  }
  if (duration != null) style["--reveal-duration"] = `${Math.round(duration)}ms`;
  if (distance != null) style["--reveal-distance"] = distance;
  return {
    "data-scroll-reveal": variant,
    style: style as CSSProperties,
  };
}

/** Explicit `--reveal-delay` in ms (no stagger maths), for one-off accents. */
export function revealDelay(variant: RevealVariant, delayMs: number, options: Omit<RevealOptions, "index" | "baseDelay"> = {}) {
  return reveal(variant, { ...options, baseDelay: delayMs });
}

/**
 * Card in a grid that tips up into place in 3D when scrolled into view.
 * Cards in the same row start one after another; `perRow` is the number of cards in a desktop row.
 */
export function reveal3d(index: number, perRow = 3) {
  const safeIndex = clampInt(index);
  const safePerRow = Math.max(1, clampInt(perRow, 1) || 1);
  return {
    "data-scroll-reveal": "3d",
    style: { "--reveal-delay": `${(safeIndex % safePerRow) * REVEAL_STEP_MS}ms` } as CSSProperties,
  };
}
