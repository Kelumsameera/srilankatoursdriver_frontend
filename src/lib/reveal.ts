import type { CSSProperties } from "react";

// Props for one card in a grid: it tips up into place in 3D when scrolled into view (see globals.css).
// Cards in the same row start one after another; `perRow` is the number of cards in a desktop row.
export function reveal3d(index: number, perRow = 3) {
  return {
    "data-scroll-reveal": "3d",
    style: { "--reveal-delay": `${(index % perRow) * 110}ms` } as CSSProperties,
  };
}
