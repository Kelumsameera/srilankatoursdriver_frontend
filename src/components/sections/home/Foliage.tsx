import Image from "next/image";

import { cn } from "@/lib/utils";

/*
 * Tropical foliage for the homepage composition (palm fronds and fern branches). Purely decorative:
 * every SVG is aria-hidden and ignores the pointer. Shapes are generated once at module load from a few curves,
 * so the markup stays small and identical between server and client.
 */

type Pt = readonly [number, number];

/** Point and direction on a quadratic Bézier stem. */
function onStem(p0: Pt, c: Pt, p1: Pt, t: number) {
  const x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0];
  const y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1];
  const angle = Math.atan2(2 * (1 - t) * (c[1] - p0[1]) + 2 * t * (p1[1] - c[1]), 2 * (1 - t) * (c[0] - p0[0]) + 2 * t * (p1[0] - c[0]));
  return { x, y, angle };
}

const r = (n: number) => Math.round(n * 10) / 10;

/** Leaflets along a stem: filled blades (palm) or single strokes (fern line art). */
function leaflets(p0: Pt, c: Pt, p1: Pt, count: number, length: number, spread: number, filled: boolean) {
  const paths: string[] = [];
  for (let i = 1; i < count; i++) {
    const t = i / count;
    const { x, y, angle } = onStem(p0, c, p1, t);
    // Longest in the middle of the frond, shorter at the base and the tip.
    const size = length * (0.35 + 0.65 * Math.sin(Math.PI * Math.min(1, t * 1.1)));
    for (const side of [-1, 1]) {
      const a = angle + side * ((spread * Math.PI) / 180) + 0.22; // a slight droop
      const ex = x + Math.cos(a) * size;
      const ey = y + Math.sin(a) * size;
      const c1x = x + Math.cos(a - side * 0.32) * size * 0.6;
      const c1y = y + Math.sin(a - side * 0.32) * size * 0.6;
      if (filled) {
        const c2x = x + Math.cos(a + side * 0.2) * size * 0.55;
        const c2y = y + Math.sin(a + side * 0.2) * size * 0.55;
        paths.push(`M${r(x)} ${r(y)}Q${r(c1x)} ${r(c1y)} ${r(ex)} ${r(ey)}Q${r(c2x)} ${r(c2y)} ${r(x)} ${r(y)}Z`);
      } else {
        paths.push(`M${r(x)} ${r(y)}Q${r(c1x)} ${r(c1y)} ${r(ex)} ${r(ey)}`);
      }
    }
  }
  return paths.join("");
}

const FERN_STEM: [Pt, Pt, Pt] = [
  [20, 300],
  [90, 140],
  [240, 20],
];
const FERN_LINES = leaflets(...FERN_STEM, 22, 46, 58, false);

type LeafProps = { className?: string };

/** Delicate fern branch in fine line art (viewBox 260×320). */
export function FernBranch({ className }: LeafProps) {
  return (
    <svg viewBox="0 0 260 320" preserveAspectRatio="xMidYMid meet" aria-hidden focusable="false" className={cn("pointer-events-none", className)}>
      <g fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round">
        <path d={`M${FERN_STEM[0].join(" ")}Q${FERN_STEM[1].join(" ")} ${FERN_STEM[2].join(" ")}`} />
        <path d={FERN_LINES} />
      </g>
    </svg>
  );
}

/**
 * A photographic tropical foliage cluster for a band's edge. It is positioned absolutely so it can
 * reach past the section boundary (the section needs `relative isolate` and a z-index above its neighbours).
 * The image has a transparent background, leaving the section content readable.
 *
 * Decorations do not mirror in RTL: `side` is a physical left/right, so Arabic shows the leaves exactly like English.
 * Only physical classes (left-0, right-0, translate-x, scale-x) are used here, never start/end or rtl: variants.
 */
export function FoliageCluster({ side, className, front, inset = false }: { side: "left" | "right"; className?: string; front?: boolean; inset?: boolean }) {
  return (
    <div
      aria-hidden
      className={cn(
        // Behind the section's content by default (-z-10; the section isolates its own stacking context), so leaves never
        // cover text. `front` places them over a photo instead (hero corners, kept clear of text and controls).
        "pointer-events-none absolute overflow-visible",
        inset
          ? "z-0 aspect-1129/1393 w-16 sm:w-20 md:w-[clamp(5rem,8vw,7rem)]"
          : front
            ? "z-0 h-40 w-32 sm:h-56 sm:w-48 lg:h-88 lg:w-72 2xl:h-108 2xl:w-80"
            : "-z-10 hidden h-80 w-64 md:block xl:h-104 xl:w-80",
        // The photo grows from its bottom-left corner, so the right-hand cluster is the same photo flipped
        inset
          ? side === "left"
            ? "left-0"
            : "right-0 -scale-x-100"
          : side === "left"
            ? "left-0 -translate-x-1/3"
            : "right-0 translate-x-1/3 -scale-x-100",
        className,
      )}
      style={inset ? { maskImage: "linear-gradient(to bottom, transparent, black 18%, black 78%, transparent)" } : undefined}
    >
      <Image
        src="/images/decor/homepage-tropical-foliage-corner-v2.webp"
        alt=""
        fill
        sizes={inset ? "112px" : "(max-width: 639px) 8rem, (max-width: 1023px) 12rem, 20rem"}
        className="object-contain object-bottom-left"
      />
    </div>
  );
}
