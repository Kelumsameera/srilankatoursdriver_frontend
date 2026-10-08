"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

/**
 * Cycles through short phrases with a fade. Screen readers get the full list once (no live updates),
 * and users who prefer reduced motion see the first item only.
 */
export function RotatingText({ items, interval = 2800, className }: { items: string[]; interval?: number; className?: string }) {
  const [index, setIndex] = useState(0);
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (items.length < 2 || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    let swap: ReturnType<typeof setTimeout>;
    const timer = setInterval(() => {
      setVisible(false);
      swap = setTimeout(() => {
        setIndex((i) => (i + 1) % items.length);
        setVisible(true);
      }, 350);
    }, interval);
    return () => {
      clearInterval(timer);
      clearTimeout(swap);
    };
  }, [items.length, interval]);

  if (!items.length) return null;
  return (
    <>
      <span className="sr-only">{items.join(", ")}</span>
      <span aria-hidden className={cn("inline-block transition-all duration-300", visible ? "translate-y-0 opacity-100" : "-translate-y-1.5 opacity-0", className)}>
        {items[index % items.length]}
      </span>
    </>
  );
}
