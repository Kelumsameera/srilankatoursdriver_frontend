"use client";

import { useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Info, Monitor, Smartphone, Tablet } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { Card, ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/ui";
import { BarList, SERIES, StackedColumns } from "@/components/admin/charts";
import { Delta, Funnel, Heatmap, Sparkline, TrendChart } from "@/components/admin/trend-charts";
import { cn } from "@/lib/utils";

type Range = "7d" | "30d" | "90d" | "12m";
const RANGES: { value: Range; label: string }[] = [
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
  { value: "90d", label: "90 days" },
  { value: "12m", label: "12 months" },
];

interface Kpi {
  value: number;
  previous: number;
}
type Tally = { label: string; count: number }[];

interface Analytics {
  range: Range;
  granularity: "day" | "month";
  from: string;
  to: string;
  live: number;
  kpis: Record<"visitors" | "pageviews" | "sessions" | "viewsPerSession" | "bounceRate" | "bookings" | "conversionRate" | "signups", Kpi>;
  series: { key: string; visitors: number; pageviews: number; bookings: number; signups: number; enquiries: number; customers: number }[];
  previousSeries: { key: string; visitors: number; pageviews: number }[];
  topPages: { path: string; views: number; visitors: number; entries: number }[];
  sources: Tally;
  devices: Tally;
  browsers: Tally;
  os: Tally;
  countries: Tally;
  locales: Tally;
  heatmap: number[][];
  funnel: { label: string; value: number }[];
}

/** Metrics the main chart can show; each has its own fixed colour. */
const CHART_METRICS = {
  visitors: { name: "Visitors", color: SERIES.blue },
  pageviews: { name: "Page views", color: SERIES.blue },
  bookings: { name: "Booking requests", color: SERIES.aqua },
  signups: { name: "New customers", color: SERIES.orange },
} as const;
type ChartMetric = keyof typeof CHART_METRICS;

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
/** "2026-10-09" → "9 Oct" (long: "Fri, 9 Oct 2026"); "2026-10" → "Oct" (long: "Oct 2026"). */
function keyLabel(key: string, long = false) {
  const [y, m, d] = key.split("-").map(Number);
  if (!d) return long ? `${MONTHS[m - 1]} ${y}` : MONTHS[m - 1];
  if (!long) return `${d} ${MONTHS[m - 1]}`;
  const weekday = new Date(Date.UTC(y, m - 1, d)).toLocaleDateString("en", { weekday: "short", timeZone: "UTC" });
  return `${weekday}, ${d} ${MONTHS[m - 1]} ${y}`;
}

const regionNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "region" }) : null;
const languageNames = typeof Intl !== "undefined" && "DisplayNames" in Intl ? new Intl.DisplayNames(["en"], { type: "language" }) : null;
const flag = (code: string) => (/^[A-Z]{2}$/.test(code) ? String.fromCodePoint(...[...code].map((c) => 0x1f1a5 + c.charCodeAt(0))) : "🌐");
const countryName = (code: string) => {
  if (!/^[A-Z]{2}$/.test(code)) return code;
  try {
    return regionNames?.of(code) ?? code;
  } catch {
    return code;
  }
};
const languageName = (code: string) => {
  try {
    return (code && code !== "—" && languageNames?.of(code)) || code;
  } catch {
    return code;
  }
};
const DEVICE_ICON = { desktop: Monitor, mobile: Smartphone, tablet: Tablet } as Record<string, typeof Monitor>;
const num = (n: number) => n.toLocaleString("en");

export default function AnalyticsPage() {
  const [range, setRange] = useState<Range>("30d");
  const [metric, setMetric] = useState<ChartMetric>("visitors");
  const { data, isLoading, error, refetch, isFetching } = useQuery({
    queryKey: ["analytics", range],
    queryFn: () => api.get<Analytics>(`/admin/analytics?range=${range}`),
    placeholderData: keepPreviousData,
    refetchInterval: 60_000,
  });

  const header = (
    <PageHeader
      title="Analytics"
      description="Website visitors, engagement and conversions. Cookieless and anonymous – no IP addresses or personal data are stored."
      actions={
        <div className="flex flex-wrap items-center gap-3">
          {data && (
            <span className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3 py-1.5 text-xs text-slate-600 shadow-sm">
              <span className="relative flex h-2 w-2">
                <span className={cn("absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75", data.data.live > 0 && "animate-ping")} />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              <span className="font-semibold tabular-nums text-slate-900">{data.data.live}</span> online now
            </span>
          )}
          <div role="tablist" aria-label="Date range" className="inline-flex rounded-lg border border-slate-200 bg-white p-0.5 shadow-sm">
            {RANGES.map((r) => (
              <button
                key={r.value}
                type="button"
                role="tab"
                aria-selected={range === r.value}
                onClick={() => setRange(r.value)}
                className={cn("rounded-md px-3 py-1.5 text-xs font-medium transition-colors", range === r.value ? "bg-forest-800 text-white" : "text-slate-600 hover:bg-slate-100")}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>
      }
    />
  );

  if (isLoading) return (
    <div>
      {header}
      <LoadingBlock />
    </div>
  );
  if (error || !data) return (
    <div>
      {header}
      <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
    </div>
  );

  const a = data.data;
  const k = a.kpis;
  const prevByIndex = a.previousSeries;
  const points = a.series.map((s, i) => ({
    label: keyLabel(s.key),
    title: keyLabel(s.key, true),
    value: s[metric],
    previous: metric === "visitors" || metric === "pageviews" ? (prevByIndex[i]?.[metric] ?? 0) : undefined,
  }));
  const noTraffic = k.pageviews.value === 0 && k.pageviews.previous === 0;
  const spark = (key: ChartMetric) => a.series.map((s) => s[key]);

  return (
    <div className={cn("space-y-6 transition-opacity", isFetching && "opacity-80")}>
      {header}

      {noTraffic && (
        <div className="flex gap-3 rounded-xl border border-sky-200 bg-sky-50 p-4 text-sm text-sky-900">
          <Info className="mt-0.5 h-4 w-4 shrink-0" />
          <p>
            No visitor data for this period yet. Page views are recorded from the moment this version of the website is live; booking and customer figures below already include
            older data.
          </p>
        </div>
      )}

      {/* KPI tiles – the four with a series switch the main chart. */}
      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <MetricTile label="Visitors" kpi={k.visitors} active={metric === "visitors"} onClick={() => setMetric("visitors")} spark={spark("visitors")} color={SERIES.blue} />
        <MetricTile label="Page views" kpi={k.pageviews} active={metric === "pageviews"} onClick={() => setMetric("pageviews")} spark={spark("pageviews")} color={SERIES.blue} />
        <MetricTile label="Booking requests" kpi={k.bookings} active={metric === "bookings"} onClick={() => setMetric("bookings")} spark={spark("bookings")} color={SERIES.aqua} />
        <MetricTile label="New customers" kpi={k.signups} active={metric === "signups"} onClick={() => setMetric("signups")} spark={spark("signups")} color={SERIES.orange} />
        <MetricTile label="Sessions" kpi={k.sessions} />
        <MetricTile label="Pages / session" kpi={k.viewsPerSession} />
        <MetricTile label="Bounce rate" kpi={k.bounceRate} suffix="%" invert hint="Visits that viewed only one page" />
        <MetricTile label="Booking conversion" kpi={k.conversionRate} suffix="%" hint="Booking requests per 100 visitors" />
      </div>

      <Card title={`${CHART_METRICS[metric].name} – ${RANGES.find((r) => r.value === range)?.label.replace(/^(\d)/, "last $1")}`}>
        <TrendChart key={metric} points={points} name={CHART_METRICS[metric].name} color={CHART_METRICS[metric].color} height={280} />
      </Card>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card title="Top pages" className="xl:col-span-3">
          {a.topPages.length === 0 ? (
            <p className="py-6 text-center text-sm text-slate-400">No page views yet.</p>
          ) : (
            <div className="-mx-5 -my-5 overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                  <tr>
                    <th className="px-5 py-2.5 text-start font-medium">Page</th>
                    <th className="px-3 py-2.5 text-end font-medium">Visitors</th>
                    <th className="px-3 py-2.5 text-end font-medium">Views</th>
                    <th className="px-5 py-2.5 text-end font-medium" title="Visits that started on this page">
                      Entries
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {a.topPages.map((p) => {
                    const max = a.topPages[0].views || 1;
                    return (
                      <tr key={p.path} className="relative">
                        <td className="relative max-w-0 px-5 py-2.5">
                          <span className="absolute inset-y-1 start-2 rounded bg-sky-50" style={{ width: `calc(${(p.views / max) * 100}% - 8px)` }} aria-hidden />
                          <span className="relative block truncate font-mono text-xs text-slate-800">{p.path}</span>
                        </td>
                        <td className="px-3 py-2.5 text-end tabular-nums text-slate-700">{num(p.visitors)}</td>
                        <td className="px-3 py-2.5 text-end font-semibold tabular-nums text-slate-900">{num(p.views)}</td>
                        <td className="px-5 py-2.5 text-end tabular-nums text-slate-500">{num(p.entries)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Card>
        <Card title="Traffic sources" className="xl:col-span-2">
          <BarList items={a.sources} empty="No visits yet." />
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card title="Devices">
          <BarList
            items={a.devices}
            empty="No visits yet."
            renderLabel={(l) => {
              const Icon = DEVICE_ICON[l] ?? Monitor;
              return (
                <span className="inline-flex items-center gap-2 capitalize">
                  <Icon className="h-4 w-4 text-slate-400" />
                  {l}
                </span>
              );
            }}
          />
        </Card>
        <Card title="Browsers">
          <BarList items={a.browsers} empty="No visits yet." />
        </Card>
        <Card title="Operating systems">
          <BarList items={a.os} empty="No visits yet." />
        </Card>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card title="Countries">
          <BarList
            items={a.countries}
            empty="No visits yet."
            renderLabel={(c) => (
              <span className="inline-flex items-center gap-2">
                <span aria-hidden>{flag(c)}</span>
                {countryName(c)}
              </span>
            )}
          />
          {a.countries.length > 0 && a.countries.every((c) => c.label === "Unknown") && (
            <p className="mt-4 text-xs text-slate-400">Country detection needs the website’s API proxy with API_PROXY_SECRET (e.g. on Vercel).</p>
          )}
        </Card>
        <Card title="Website language">
          <BarList items={a.locales} empty="No visits yet." renderLabel={(l) => `${languageName(l)} (${l})`} />
        </Card>
      </div>

      <div className="grid gap-6 xl:grid-cols-5">
        <Card title="Busiest times (Sri Lanka time)" className="xl:col-span-3">
          <Heatmap grid={a.heatmap} />
        </Card>
        <Card title="Booking funnel" className="xl:col-span-2">
          <Funnel steps={a.funnel} />
        </Card>
      </div>

      <div>
        <h2 className="mb-3 font-sans text-lg font-semibold tracking-tight text-slate-900">Growth</h2>
        <div className="grid gap-6 xl:grid-cols-2">
          <Card title="Registered customers (total)">
            <TrendChart
              points={a.series.map((s) => ({ label: keyLabel(s.key), title: keyLabel(s.key, true), value: s.customers }))}
              name="Customers"
              color={SERIES.orange}
              height={240}
              zeroBased={false}
            />
          </Card>
          <Card title="Booking requests & tailor-made enquiries">
            <StackedColumns
              data={a.series.map((s) => ({ month: s.key, bookings: s.bookings, enquiries: s.enquiries }))}
              series={[
                { key: "bookings", label: "Booking requests", color: SERIES.aqua },
                { key: "enquiries", label: "Tailor-made enquiries", color: SERIES.blue },
              ]}
              formatKey={keyLabel}
              height={200}
            />
          </Card>
        </div>
      </div>
    </div>
  );
}

function MetricTile({
  label,
  kpi,
  suffix = "",
  invert,
  hint,
  active,
  onClick,
  spark,
  color,
}: {
  label: string;
  kpi: Kpi;
  suffix?: string;
  invert?: boolean;
  hint?: string;
  active?: boolean;
  onClick?: () => void;
  spark?: number[];
  color?: string;
}) {
  const body = (
    <>
      <div className="flex items-start justify-between gap-2">
        <p className="text-xs font-medium uppercase tracking-wide text-slate-500" title={hint}>
          {label}
        </p>
        <Delta value={kpi.value} previous={kpi.previous} invert={invert} />
      </div>
      <p className="mt-2 text-3xl font-semibold tabular-nums text-slate-900">
        {num(kpi.value)}
        {suffix && <span className="text-xl text-slate-500">{suffix}</span>}
      </p>
      {spark ? <Sparkline values={spark} color={color} className="mt-2" /> : hint ? <p className="mt-2 text-xs text-slate-400">{hint}</p> : null}
    </>
  );
  const base = "rounded-xl border bg-white p-4 text-start shadow-sm";
  if (!onClick) return <div className={cn(base, "border-slate-200")}>{body}</div>;
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={cn(base, "transition-colors hover:border-forest-600", active ? "border-forest-600 ring-2 ring-forest-600/15" : "border-slate-200")}
    >
      {body}
    </button>
  );
}
