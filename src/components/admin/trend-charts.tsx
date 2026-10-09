"use client";

import { useEffect, useRef, useState, type MouseEvent } from "react";
import { cn } from "@/lib/utils";
import { BASELINE, GRID, SERIES, niceScale } from "./charts";

/** Muted ink for the "previous period" comparison line – recedes behind the current series. */
const PREVIOUS = "#a8a79f";

/** Width of an element, kept current with a ResizeObserver (charts draw in real pixels so strokes stay crisp). */
function useWidth<T extends HTMLElement>() {
  const ref = useRef<T>(null);
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setWidth(Math.round(entry.contentRect.width)));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  return [ref, width] as const;
}

export interface TrendPoint {
  label: string;
  /** Longer label for the tooltip (e.g. the full date). */
  title: string;
  value: number;
  previous?: number;
}

/**
 * One measure over time: 2px line with a 10% wash, an optional muted "previous period" line for
 * comparison, and a crosshair tooltip. Single y-axis only.
 */
export function TrendChart({
  points,
  color = SERIES.blue,
  name,
  format = (n: number) => n.toLocaleString("en"),
  height = 260,
  zeroBased = true,
}: {
  points: TrendPoint[];
  color?: string;
  name: string;
  format?: (n: number) => string;
  height?: number;
  /** false for running totals: the axis starts near the lowest value so growth stays visible. */
  zeroBased?: boolean;
}) {
  const [ref, width] = useWidth<HTMLDivElement>();
  const [hover, setHover] = useState<number | null>(null);
  const hasPrev = points.some((p) => p.previous !== undefined);
  const values = points.flatMap((p) => (p.previous === undefined ? [p.value] : [p.value, p.previous]));
  const { bottom, top, ticks } = zeroBased ? { bottom: 0, ...niceScale(Math.max(0, ...values)) } : tightScale(values);
  const padL = 40;
  const padR = 12;
  const padT = 12;
  const padB = 28;
  const plotW = Math.max(0, width - padL - padR);
  const plotH = height - padT - padB;
  const x = (i: number) => padL + (points.length <= 1 ? plotW / 2 : (i / (points.length - 1)) * plotW);
  const y = (v: number) => padT + plotH - ((v - bottom) / (top - bottom || 1)) * plotH;
  const line = (vals: number[]) => vals.map((v, i) => `${i ? "L" : "M"}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join("");
  const current = line(points.map((p) => p.value));
  const area = points.length ? `${current}L${x(points.length - 1).toFixed(1)},${y(bottom)}L${x(0).toFixed(1)},${y(bottom)}Z` : "";
  const prev = hasPrev ? line(points.map((p) => p.previous ?? 0)) : "";
  // Roughly one x label per 70px, always including the last point.
  const every = Math.max(1, Math.ceil(points.length / Math.max(2, Math.floor(plotW / 70))));
  const showLabel = (i: number) => (i === points.length - 1 ? true : i % every === 0 && points.length - 1 - i >= every / 2);

  const onMove = (e: MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const rel = e.clientX - rect.left - padL;
    const i = points.length <= 1 ? 0 : Math.round((rel / plotW) * (points.length - 1));
    setHover(Math.max(0, Math.min(points.length - 1, i)));
  };
  const h = hover !== null ? points[hover] : null;

  return (
    <div>
      <div ref={ref} className="relative" style={{ height }}>
        {width > 0 && (
          <svg width={width} height={height} className="block" onMouseMove={onMove} onMouseLeave={() => setHover(null)} role="img" aria-label={`${name} over time`}>
            {ticks.map((t) => (
              <g key={t}>
                <line x1={padL} x2={width - padR} y1={y(t)} y2={y(t)} stroke={t === bottom ? BASELINE : GRID} strokeWidth={1} />
                <text x={padL - 8} y={y(t)} dy="0.32em" textAnchor="end" className="fill-slate-400 text-[10px] tabular-nums">
                  {format(t)}
                </text>
              </g>
            ))}
            {points.map((p, i) =>
              showLabel(i) ? (
                <text key={p.title} x={x(i)} y={height - 8} textAnchor={i === 0 ? "start" : i === points.length - 1 ? "end" : "middle"} className="fill-slate-400 text-[10px]">
                  {p.label}
                </text>
              ) : null,
            )}
            <path d={area} fill={color} opacity={0.1} />
            {hasPrev && <path d={prev} fill="none" stroke={PREVIOUS} strokeWidth={1.5} strokeLinejoin="round" strokeLinecap="round" />}
            <path d={current} fill="none" stroke={color} strokeWidth={2} strokeLinejoin="round" strokeLinecap="round" />
            {h && hover !== null && (
              <g>
                <line x1={x(hover)} x2={x(hover)} y1={padT} y2={padT + plotH} stroke={BASELINE} strokeWidth={1} />
                {hasPrev && <circle cx={x(hover)} cy={y(h.previous ?? 0)} r={3.5} fill={PREVIOUS} stroke="#fff" strokeWidth={2} />}
                <circle cx={x(hover)} cy={y(h.value)} r={4.5} fill={color} stroke="#fff" strokeWidth={2} />
              </g>
            )}
          </svg>
        )}
        {h && hover !== null && (
          <div
            role="tooltip"
            className="pointer-events-none absolute top-2 z-10 min-w-44 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg"
            style={x(hover) > width / 2 ? { right: width - x(hover) + 12 } : { left: x(hover) + 12 }}
          >
            <p className="mb-1.5 font-semibold text-slate-900">{h.title}</p>
            <p className="flex items-center justify-between gap-4 text-slate-600">
              <span className="flex items-center gap-1.5">
                <span className="h-2 w-2 rounded-full" style={{ background: color }} />
                {name}
              </span>
              <span className="font-semibold tabular-nums text-slate-900">{format(h.value)}</span>
            </p>
            {hasPrev && (
              <p className="mt-1 flex items-center justify-between gap-4 text-slate-500">
                <span className="flex items-center gap-1.5">
                  <span className="h-2 w-2 rounded-full" style={{ background: PREVIOUS }} />
                  Previous period
                </span>
                <span className="tabular-nums">{format(h.previous ?? 0)}</span>
              </p>
            )}
          </div>
        )}
      </div>
      {hasPrev && (
        <ul className="mt-2 flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: color }} />
            {name}
          </li>
          <li className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: PREVIOUS }} />
            Previous period
          </li>
        </ul>
      )}
    </div>
  );
}

/** Axis around the data's own range (4 even integer steps), for series where 0 is not meaningful. */
function tightScale(values: number[]) {
  const lo = Math.min(...values, Infinity);
  const hi = Math.max(...values, -Infinity);
  if (!Number.isFinite(lo)) return { bottom: 0, top: 4, ticks: [0, 1, 2, 3, 4] };
  const step = Math.max(1, Math.ceil((hi - lo || 4) / 4));
  const bottom = Math.max(0, Math.floor(lo / step) * step - (hi === lo ? step * 2 : 0));
  return { bottom, top: bottom + step * 4, ticks: [0, 1, 2, 3, 4].map((i) => bottom + i * step) };
}

/** Tiny trend line for stat tiles – shape only, no axes. */
export function Sparkline({ values, color = SERIES.blue, className }: { values: number[]; color?: string; className?: string }) {
  if (values.length < 2) return null;
  const max = Math.max(1, ...values);
  const w = 100;
  const h = 28;
  const pts = values.map((v, i) => `${((i / (values.length - 1)) * w).toFixed(1)},${(h - 2 - (v / max) * (h - 4)).toFixed(1)}`);
  return (
    <svg viewBox={`0 0 ${w} ${h}`} preserveAspectRatio="none" className={cn("h-7 w-full", className)} aria-hidden>
      <polygon points={`0,${h} ${pts.join(" ")} ${w},${h}`} fill={color} opacity={0.1} />
      <polyline points={pts.join(" ")} fill="none" stroke={color} strokeWidth={1.5} vectorEffect="non-scaling-stroke" strokeLinejoin="round" />
    </svg>
  );
}

/** Change vs the previous period. `invert` for measures where down is good (e.g. bounce rate). */
export function Delta({ value, previous, invert }: { value: number; previous: number; invert?: boolean }) {
  if (!previous && !value) return <span className="text-xs text-slate-400">—</span>;
  if (!previous) return <span className="rounded-full bg-sky-50 px-1.5 py-0.5 text-xs font-medium text-sky-700">New</span>;
  const change = Math.round(((value - previous) / previous) * 1000) / 10;
  const good = invert ? change <= 0 : change >= 0;
  return (
    <span
      className={cn("inline-flex items-center gap-0.5 rounded-full px-1.5 py-0.5 text-xs font-medium tabular-nums", good ? "bg-emerald-50 text-emerald-700" : "bg-red-50 text-red-700")}
      title={`Previous period: ${previous.toLocaleString("en")}`}
    >
      {change >= 0 ? "▲" : "▼"} {Math.abs(change)}%
    </span>
  );
}

/* ───────────────────────── Heatmap & funnel ───────────────────────── */

/** Sequential blue ramp (light → dark); step 0 is "no activity". */
const HEAT = ["#f1f4f8", "#cde2fb", "#9ec5f4", "#6da7ec", "#3987e5", "#256abf", "#184f95"];
const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

/** Activity by weekday × hour (rows Monday-first, 24 columns). */
export function Heatmap({ grid, unit = "page views" }: { grid: number[][]; unit?: string }) {
  const max = Math.max(0, ...grid.flat());
  const step = (v: number) => (v === 0 || max === 0 ? 0 : Math.min(HEAT.length - 1, 1 + Math.floor((v / max) * (HEAT.length - 1.0001))));
  return (
    <div className="overflow-x-auto">
      <div className="min-w-[560px]">
        <div className="grid gap-[3px]" style={{ gridTemplateColumns: "32px repeat(24, minmax(0, 1fr))" }}>
          {grid.map((row, d) => (
            <div key={WEEKDAYS[d]} className="contents">
              <span className="self-center text-[10px] text-slate-500">{WEEKDAYS[d]}</span>
              {row.map((v, hour) => (
                <span
                  key={hour}
                  title={`${WEEKDAYS[d]} ${String(hour).padStart(2, "0")}:00 – ${v} ${unit}`}
                  className="aspect-square rounded-[3px] transition-transform hover:scale-125 hover:ring-2 hover:ring-white"
                  style={{ background: HEAT[step(v)] }}
                />
              ))}
            </div>
          ))}
          <span />
          {Array.from({ length: 24 }, (_, hour) => (
            <span key={hour} className="text-center text-[9px] text-slate-400">
              {hour % 3 === 0 ? String(hour).padStart(2, "0") : ""}
            </span>
          ))}
        </div>
        <div className="mt-3 flex items-center justify-end gap-1.5 text-[10px] text-slate-500">
          Less
          {HEAT.map((c) => (
            <span key={c} className="h-2.5 w-2.5 rounded-[2px]" style={{ background: c }} />
          ))}
          More
        </div>
      </div>
    </div>
  );
}

/** Conversion funnel: each step's share of the first step, and the rate from the step before. */
export function Funnel({ steps, color = SERIES.aqua }: { steps: { label: string; value: number }[]; color?: string }) {
  const first = steps[0]?.value ?? 0;
  return (
    <ol className="space-y-4">
      {steps.map((s, i) => {
        const share = first ? (s.value / first) * 100 : 0;
        const prev = i > 0 ? steps[i - 1].value : 0;
        const stepRate = prev ? Math.round((s.value / prev) * 1000) / 10 : null;
        return (
          <li key={s.label}>
            <div className="mb-1.5 flex items-baseline justify-between gap-3 text-sm">
              <span className="flex min-w-0 items-center gap-2 text-slate-700">
                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-slate-100 text-[10px] font-semibold text-slate-600">{i + 1}</span>
                <span className="truncate">{s.label}</span>
              </span>
              <span className="shrink-0 tabular-nums">
                <span className="font-semibold text-slate-900">{s.value.toLocaleString("en")}</span>
                {stepRate !== null && <span className="ms-2 text-xs text-slate-500">{stepRate}% of step {i}</span>}
              </span>
            </div>
            <div className="h-6 overflow-hidden rounded-md bg-slate-100" title={`${Math.round(share * 10) / 10}% of ${steps[0]?.label.toLowerCase()}`}>
              <div className="h-6 rounded-md transition-[width] duration-700" style={{ width: `${Math.max(Math.min(share, 100), s.value ? 1.5 : 0)}%`, background: color }} />
            </div>
          </li>
        );
      })}
    </ol>
  );
}
