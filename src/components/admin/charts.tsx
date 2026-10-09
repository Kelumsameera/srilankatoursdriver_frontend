"use client";

import { useState, type CSSProperties, type ReactNode } from "react";
import { cn } from "@/lib/utils";

/**
 * Small dependency-free charts for the admin dashboard. Colours are a CVD-validated categorical
 * set (blue / aqua / orange – checked against the white card surface); every series is also named
 * in a legend with its total, and stacked charts offer a table view.
 */
export const SERIES = { blue: "#2a78d6", aqua: "#1baf7a", orange: "#eb6834" } as const;
export const GRID = "#e8e7e1";
export const BASELINE = "#c3c2b7";

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
export const monthLabel = (ym: string, withYear = false) => {
  const [y, m] = ym.split("-");
  return `${MONTHS[Number(m) - 1] ?? m}${withYear ? ` ${y}` : ""}`;
};

/** Round axis maximum with 4 even ticks. */
export function niceScale(max: number) {
  if (max <= 4) return { top: 4, ticks: [0, 1, 2, 3, 4] };
  const raw = max / 4;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const step = [1, 2, 2.5, 5, 10].map((f) => f * mag).find((s) => s >= raw) ?? raw;
  const stepInt = Math.ceil(step);
  return { top: stepInt * 4, ticks: [0, 1, 2, 3, 4].map((i) => i * stepInt) };
}

export interface StackSeries<K extends string> {
  key: K;
  label: string;
  color: string;
}

/** Stacked monthly columns with a hover tooltip, legend (with totals) and an optional table view. */
export function StackedColumns<K extends string>({
  data,
  series,
  height = 220,
  formatKey = monthLabel,
}: {
  data: ({ month: string } & Record<K, number>)[];
  series: StackSeries<K>[];
  height?: number;
  /** Axis / tooltip label for a bucket key (`long` for the tooltip and table). */
  formatKey?: (key: string, long?: boolean) => string;
}) {
  const [hover, setHover] = useState<number | null>(null);
  const [asTable, setAsTable] = useState(false);
  const totals = data.map((d) => series.reduce((sum, s) => sum + d[s.key], 0));
  const { top, ticks } = niceScale(Math.max(0, ...totals));
  const seriesTotals = series.map((s) => data.reduce((sum, d) => sum + d[s.key], 0));

  return (
    <div>
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <ul className="flex flex-wrap gap-x-5 gap-y-1 text-xs text-slate-600">
          {series.map((s, i) => (
            <li key={s.key} className="flex items-center gap-1.5">
              <span className="h-2.5 w-2.5 rounded-sm" style={{ background: s.color }} />
              {s.label}
              <span className="font-semibold tabular-nums text-slate-900">{seriesTotals[i]}</span>
            </li>
          ))}
        </ul>
        <button type="button" onClick={() => setAsTable((v) => !v)} className="text-xs font-medium text-forest-700 hover:underline">
          {asTable ? "Show chart" : "Show table"}
        </button>
      </div>

      {asTable ? (
        <div className="overflow-x-auto">
          <table className="w-full text-sm tabular-nums">
            <thead className="text-left text-xs uppercase tracking-wide text-slate-500">
              <tr>
                <th className="py-2 font-medium">Month</th>
                {series.map((s) => (
                  <th key={s.key} className="py-2 text-right font-medium">
                    {s.label}
                  </th>
                ))}
                <th className="py-2 text-right font-medium">Total</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {data.map((d, i) => (
                <tr key={d.month}>
                  <td className="py-1.5 text-slate-700">{formatKey(d.month, true)}</td>
                  {series.map((s) => (
                    <td key={s.key} className="py-1.5 text-right text-slate-700">
                      {d[s.key]}
                    </td>
                  ))}
                  <td className="py-1.5 text-right font-semibold text-slate-900">{totals[i]}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="flex gap-2">
          {/* y-axis */}
          <div className="relative w-6 shrink-0 text-right text-[10px] tabular-nums text-slate-400" style={{ height }}>
            {ticks.map((t) => (
              <span key={t} className="absolute right-0" style={{ bottom: `${(t / top) * 100}%`, transform: "translateY(50%)" }}>
                {t}
              </span>
            ))}
          </div>
          <div className="min-w-0 flex-1">
            <div className="relative" style={{ height }} onMouseLeave={() => setHover(null)}>
              {ticks.map((t) => (
                <div key={t} className="absolute inset-x-0 h-px" style={{ bottom: `${(t / top) * 100}%`, background: t === 0 ? BASELINE : GRID }} />
              ))}
              <div className="absolute inset-0 flex">
                {data.map((d, i) => (
                  <div
                    key={d.month}
                    className="relative flex flex-1 cursor-default justify-center"
                    onMouseEnter={() => setHover(i)}
                    onFocus={() => setHover(i)}
                    onBlur={() => setHover(null)}
                    tabIndex={0}
                    aria-label={`${formatKey(d.month, true)}: ${series.map((s) => `${s.label} ${d[s.key]}`).join(", ")}`}
                  >
                    {hover === i && <div className="absolute inset-y-0 w-full rounded-md bg-slate-900/[0.04]" />}
                    {/* Stack grows from the baseline; 2px surface gaps between segments, rounded top only. */}
                    <div className="absolute bottom-0 flex w-[60%] max-w-6 flex-col-reverse gap-0.5" style={{ height: `${(totals[i] / top) * 100}%` }}>
                      {series.map((s) =>
                        d[s.key] > 0 ? <div key={s.key} style={{ flexGrow: d[s.key], background: s.color }} className="min-h-[2px] last:rounded-t-[4px]" /> : null,
                      )}
                    </div>
                    {hover === i && (
                      <div
                        role="tooltip"
                        className={cn(
                          "pointer-events-none absolute z-10 w-40 rounded-lg border border-slate-200 bg-white p-3 text-xs shadow-lg",
                          i > data.length / 2 ? "right-1/2" : "left-1/2",
                        )}
                        style={{ bottom: `calc(${Math.min(90, (totals[i] / top) * 100)}% + 8px)` }}
                      >
                        <p className="mb-1.5 font-semibold text-slate-900">{formatKey(d.month, true)}</p>
                        {series.map((s) => (
                          <p key={s.key} className="flex items-center justify-between gap-2 text-slate-600">
                            <span className="flex items-center gap-1.5">
                              <span className="h-2 w-2 rounded-sm" style={{ background: s.color }} />
                              {s.label}
                            </span>
                            <span className="font-medium tabular-nums text-slate-900">{d[s.key]}</span>
                          </p>
                        ))}
                        <p className="mt-1.5 flex justify-between border-t border-slate-100 pt-1.5 font-semibold text-slate-900">
                          Total <span className="tabular-nums">{totals[i]}</span>
                        </p>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
            <div className="mt-2 flex text-[10px] text-slate-400">
              {data.map((d, i) => (
                <span key={d.month} className={cn("flex-1 overflow-visible whitespace-nowrap text-center", hover === i && "font-semibold text-slate-700")}>
                  {/* Long ranges (e.g. 90 days) label every nth column; the tooltip names each one. */}
                  {i % Math.ceil(data.length / 12) === 0 ? formatKey(d.month) : ""}
                </span>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

/** Horizontal bars for one measure across categories, each labelled with its count and share. */
export function BarList({
  items,
  color = SERIES.blue,
  empty = "No data yet.",
  renderLabel,
}: {
  items: { label: string; count: number; color?: string }[];
  color?: string;
  empty?: string;
  renderLabel?: (label: string) => ReactNode;
}) {
  const total = items.reduce((s, i) => s + i.count, 0);
  const max = Math.max(1, ...items.map((i) => i.count));
  if (!items.length || total === 0) return <p className="py-6 text-center text-sm text-slate-400">{empty}</p>;
  return (
    <ul className="space-y-3">
      {items.map((it) => (
        <li key={it.label} title={`${it.label}: ${it.count} (${Math.round((it.count / total) * 100)}%)`}>
          <div className="mb-1 flex items-baseline justify-between gap-3 text-sm">
            <span className="min-w-0 truncate text-slate-700">{renderLabel ? renderLabel(it.label) : it.label}</span>
            <span className="shrink-0 tabular-nums text-slate-900">
              <span className="font-semibold">{it.count}</span>
              <span className="ms-1.5 text-xs text-slate-400">{Math.round((it.count / total) * 100)}%</span>
            </span>
          </div>
          <div className="h-2 rounded-full bg-slate-100">
            <div
              className="h-2 rounded-full transition-[width] duration-700"
              style={{ width: `${(it.count / max) * 100}%`, minWidth: it.count ? 4 : 0, background: it.color ?? color } as CSSProperties}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

/** Ring showing one percentage – used for headline rates. */
export function RateRing({ value, color, label }: { value: number; color: string; label: string }) {
  const r = 26;
  const c = 2 * Math.PI * r;
  const v = Math.max(0, Math.min(100, value));
  return (
    <div className="flex items-center gap-3">
      <svg width="64" height="64" viewBox="0 0 64 64" role="img" aria-label={`${label}: ${v}%`} className="shrink-0 -rotate-90">
        <circle cx="32" cy="32" r={r} fill="none" stroke="#eef0f2" strokeWidth="7" />
        <circle cx="32" cy="32" r={r} fill="none" stroke={color} strokeWidth="7" strokeLinecap="round" strokeDasharray={`${(v / 100) * c} ${c}`} />
      </svg>
      <div>
        <p className="text-2xl font-semibold tabular-nums text-slate-900">{v}%</p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </div>
  );
}
