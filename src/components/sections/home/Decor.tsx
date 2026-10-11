import { cn } from "@/lib/utils";

/**
 * Organic edge between sections (purely decorative): a soft, flowing contour with a lighter feathered layer, as in
 * the design. The colour comes from `currentColor`, so pass the colour of the section it blends into, e.g.
 * "text-sand-50". `flip` puts it at the top of a section instead of the bottom.
 */
export function PaperEdge({ className, flip }: { className?: string; flip?: boolean }) {
  return (
    <svg
      viewBox="0 0 1440 90"
      preserveAspectRatio="none"
      aria-hidden
      style={{ color: flip ? "var(--previous-section-color, currentColor)" : "var(--next-section-color, currentColor)" }}
      className={cn("pointer-events-none absolute inset-x-0 h-10 w-full sm:h-14 lg:h-20", flip ? "top-0 -translate-y-px rotate-180" : "bottom-0 translate-y-px", className)}
    >
      <path
        fill="currentColor"
        opacity="0.45"
        d="M0 90V38C70 30 130 52 214 46s150-30 236-26 150 34 246 32 168-36 262-34 160 30 250 28 120-22 182-20 54 10 50 10V90Z"
      />
      <path
        fill="currentColor"
        d="M0 90V54C92 44 160 66 250 60s162-34 256-30 168 38 266 36 172-40 270-38 152 32 236 30 110-20 162-18V90Z"
      />
    </svg>
  );
}

/** Faint palm fronds in a section corner (decorative, hidden from assistive tech). */
export function Botanical({ className, side = "end" }: { className?: string; side?: "start" | "end" }) {
  return (
    <svg
      viewBox="0 0 300 300"
      aria-hidden
      className={cn("pointer-events-none absolute top-0 h-64 w-64 text-forest-700 opacity-[0.07] sm:h-80 sm:w-80", side === "end" ? "end-0" : "start-0 -scale-x-100", className)}
    >
      <g fill="currentColor">
        <path d="M290 10C210 40 140 100 90 190c-12 22-22 46-30 70l8 3c8-24 18-47 30-69C147 106 216 48 293 18z" />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const t = i / 8;
          const x = 285 - t * 205;
          const y = 15 + t * 230;
          return (
            <g key={i} transform={`translate(${x} ${y}) rotate(${-35 - t * 25})`}>
              <path d="M0 0c-18-42-10-78 6-96 4 36 8 66-6 96z" />
              <path d="M0 0c40-14 74-6 92 10-36 2-64 4-92-10z" />
            </g>
          );
        })}
      </g>
    </svg>
  );
}

/** Renders text wrapped in *asterisks* in the brand gold, e.g. "Discover *Sri Lanka*". */
export function GoldText({ text, goldClass = "font-display italic text-gold-400" }: { text: string; goldClass?: string }) {
  const parts = text.split(/\*([^*]+)\*/g);
  return (
    <>
      {parts.map((part, i) =>
        i % 2 === 1 ? (
          <span key={i} className={goldClass}>
            {part}
          </span>
        ) : (
          part
        ),
      )}
    </>
  );
}

/** Plain text without the *gold* markers (for alt text, aria labels and metadata). */
export const stripGold = (text: string) => text.replace(/\*([^*]+)\*/g, "$1");
