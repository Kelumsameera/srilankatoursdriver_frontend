"use client";

import { useEffect, useRef } from "react";

/**
 * Seasonal falling-snow overlay (Admin → Theme → "Falling snow animation").
 * One fixed canvas that never catches clicks; pauses when the tab is hidden and is skipped
 * entirely for visitors who prefer reduced motion.
 */
export function Snowfall() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let w = 0;
    let h = 0;
    let frame = 0;
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    const resize = () => {
      w = window.innerWidth;
      h = window.innerHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };
    resize();

    // Fewer flakes on phones; up to 2.5x as many near the bottom of the page (the footer's snowy scene).
    const base = Math.round(Math.min(120, Math.max(35, (w * h) / 14000)));
    const max = Math.round(base * 2.5);
    let active = base;
    const onScroll = () => {
      const left = document.documentElement.scrollHeight - (window.scrollY + h);
      const near = Math.min(1, Math.max(0, 1 - left / (h * 1.5)));
      active = Math.round(base + (max - base) * near);
    };
    onScroll();
    const flakes = Array.from({ length: max }, () => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 2.8,
      speed: 0.4 + Math.random() * 1.1,
      drift: Math.random() * Math.PI * 2,
      opacity: 0.45 + Math.random() * 0.5,
    }));

    const tick = () => {
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < active; i++) {
        const f = flakes[i];
        f.drift += 0.01;
        f.y += f.speed;
        f.x += Math.sin(f.drift) * 0.5;
        if (f.y > h + 5) {
          f.y = -5;
          f.x = Math.random() * w;
        }
        if (f.x > w + 5) f.x = -5;
        else if (f.x < -5) f.x = w + 5;
        ctx.beginPath();
        ctx.arc(f.x, f.y, f.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(255,255,255,${f.opacity})`;
        ctx.shadowColor = "rgba(160,190,220,0.6)";
        ctx.shadowBlur = 3;
        ctx.fill();
      }
      frame = requestAnimationFrame(tick);
    };
    const onVisibility = () => {
      cancelAnimationFrame(frame);
      if (!document.hidden) frame = requestAnimationFrame(tick);
    };

    frame = requestAnimationFrame(tick);
    window.addEventListener("resize", resize);
    window.addEventListener("scroll", onScroll, { passive: true });
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
      window.removeEventListener("scroll", onScroll);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  return <canvas ref={ref} aria-hidden="true" className="pointer-events-none fixed inset-0 z-[60] h-full w-full" />;
}
