import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Endless, slowly sliding row (CSS only). Items are rendered twice so the loop is seamless; the
 * copy is hidden from assistive tech and keyboard focus. Pauses on hover / focus, and becomes a
 * plain horizontally scrollable row for visitors who prefer reduced motion.
 */
export function Marquee<T>({
  items,
  render,
  getKey,
  seconds,
  className,
  itemClassName,
  label,
}: {
  items: T[];
  render: (item: T) => ReactNode;
  getKey: (item: T, index: number) => string;
  /** Duration of one full loop; defaults to ~6 s per item. */
  seconds?: number;
  className?: string;
  itemClassName?: string;
  label?: string;
}) {
  if (!items.length) return null;
  const duration = seconds ?? Math.max(20, items.length * 6);
  const list = (copy: boolean) =>
    items.map((item, i) => (
      <li
        key={`${copy ? "copy-" : ""}${getKey(item, i)}`}
        // Spacing lives on each item (not `gap`) so the track is exactly two equal halves and loops without a jump.
        className={cn("shrink-0 pe-6", copy && "motion-reduce:hidden", itemClassName)}
        aria-hidden={copy || undefined}
        inert={copy || undefined}
      >
        {render(item)}
      </li>
    ));
  return (
    <div
      className={cn(
        "group/marquee relative overflow-hidden motion-reduce:overflow-x-auto [mask-image:linear-gradient(to_right,transparent,black_4%,black_96%,transparent)]",
        className,
      )}
      role="region"
      aria-label={label}
    >
      <ul
        className="flex w-max animate-marquee py-4 group-hover/marquee:[animation-play-state:paused] group-focus-within/marquee:[animation-play-state:paused] motion-reduce:animate-none"
        style={{ "--marquee-duration": `${duration}s` } as CSSProperties}
      >
        {list(false)}
        {list(true)}
      </ul>
    </div>
  );
}
