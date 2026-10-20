"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  CalendarCheck,
  Car,
  FileText,
  Image as ImageIcon,
  Map,
  MapPin,
  MessageSquare,
  Star,
  Wand2,
  CheckCircle2,
  Inbox,
  Sparkles,
  TrendingDown,
  TrendingUp,
  Users,
  UserRound,
  Plane,
  Wallet,
  BarChart3,
} from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn, formatDate, formatPrice } from "@/lib/utils";
import { Card, Empty, ErrorBlock, PageHeader, StatusBadge } from "@/components/admin/ui";
import { BarList, RateRing, SERIES, StackedColumns, monthLabel } from "@/components/admin/charts";

interface Stats {
  cards: Record<string, number>;
  recentBookings: { _id: string; reference: string; customer?: { name?: string }; itemTitle?: string; type: string; status: string; createdAt: string }[];
  recentEnquiries: { _id: string; reference: string; personal?: { firstName?: string; lastName?: string }; travel?: { arrivalDate?: string }; status: string; createdAt: string }[];
  recentActivity: { _id: string; userEmail: string; action: string; entity: string; summary: string; timestamp: string }[];
  bookingsByMonth: { month: string; count: number }[];
  analytics?: Analytics;
}

interface Analytics {
  total: number;
  monthly: { month: string; open: number; won: number; lost: number }[];
  byStatus: { status: string; count: number }[];
  byType: { label: string; count: number }[];
  topItems: { label: string; count: number }[];
  topCountries: { label: string; count: number }[];
  revenue: { currency: string; amount: number }[];
  kpis: { confirmationRate: number; cancellationRate: number; openRequests: number; travellers: number; avgGroupSize: number; accountShare: number };
  registeredCustomers: number;
  upcomingTrips: number;
}

/** Outcome groups share one colour everywhere on the page, so "confirmed" always reads as aqua. */
const OUTCOME = {
  won: { label: "Confirmed / completed", color: SERIES.aqua },
  open: { label: "In progress", color: SERIES.blue },
  lost: { label: "Cancelled", color: SERIES.orange },
};
const OUTCOME_OF: Record<string, keyof typeof OUTCOME> = { confirmed: "won", completed: "won", cancelled: "lost" };
const TYPE_LABEL: Record<string, string> = { tour: "Tours", excursion: "Excursions", vehicle: "Vehicle + driver", general: "General trips" };

/** Things waiting for someone: highlighted while their count is above zero. */
const ATTENTION = [
  { key: "newBookings", label: "New Bookings", icon: Inbox, href: "/admin/bookings?status=new" },
  { key: "newMessages", label: "New Messages", icon: MessageSquare, href: "/admin/messages" },
  { key: "tailorMadeEnquiries", label: "Tailor-Made Enquiries", icon: Wand2, href: "/admin/tailor-made" },
  { key: "pendingReviews", label: "Pending Reviews", icon: Sparkles, href: "/admin/content/reviews" },
];

/** Totals of the website's content and bookings. */
const TOTALS = [
  { key: "totalBookings", label: "Total Bookings", icon: CalendarCheck, href: "/admin/bookings" },
  { key: "confirmedBookings", label: "Confirmed Bookings", icon: CheckCircle2, href: "/admin/bookings?status=confirmed" },
  { key: "totalTours", label: "Tours", icon: Map, href: "/admin/content/tours" },
  { key: "totalDestinations", label: "Destinations", icon: MapPin, href: "/admin/content/destinations" },
  { key: "totalVehicles", label: "Vehicles", icon: Car, href: "/admin/content/vehicles" },
  { key: "galleryItems", label: "Gallery Items", icon: ImageIcon, href: "/admin/content/gallery" },
  { key: "blogPosts", label: "Blog Posts", icon: FileText, href: "/admin/content/blog" },
  { key: "reviews", label: "Reviews", icon: Star, href: "/admin/content/reviews" },
];

/** Grey placeholder blocks shaped like the dashboard while it loads. */
function DashboardSkeleton() {
  return (
    <div className="space-y-8" aria-busy="true">
      <div className="h-12 w-72 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        {Array.from({ length: 4 }, (_, i) => (
          <div key={i} className="h-28 animate-pulse rounded-xl bg-slate-200/70" />
        ))}
      </div>
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
        {Array.from({ length: 8 }, (_, i) => (
          <div key={i} className="h-20 animate-pulse rounded-xl bg-slate-200/60" />
        ))}
      </div>
      <div className="h-72 animate-pulse rounded-xl bg-slate-200/60" />
    </div>
  );
}

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Stats>("/admin/dashboard"), enabled: can("dashboard:read") });

  if (!can("dashboard:read")) return <PageHeader title={`Welcome, ${user?.name}`} description="Use the menu to manage the content you have access to." />;
  if (isLoading) return <DashboardSkeleton />;
  if (error || !data) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const s = data.data;

  return (
    <div className="space-y-8">
      <PageHeader
        title={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}`}
        description="Overview of your website and CRM."
        actions={
          can("analytics:read") && (
            <Link href="/admin/analytics" className="inline-flex items-center gap-2 rounded-lg bg-forest-800 px-4 py-2 text-sm font-medium text-white hover:bg-forest-700">
              <BarChart3 className="h-4 w-4" /> Visitor analytics
            </Link>
          )
        }
      />
      <div data-testid="dashboard-cards" className="space-y-3">
        {/* Needs attention: amber while something is waiting */}
        <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
          {ATTENTION.map((c) => {
            const count = s.cards[c.key] ?? 0;
            return (
              <Link
                key={c.key}
                href={c.href}
                className={cn(
                  "group rounded-xl border p-4 shadow-sm transition duration-200 hover:-translate-y-0.5 hover:shadow-md motion-reduce:transform-none",
                  count > 0 ? "border-amber-200 bg-amber-50" : "border-slate-200 bg-white hover:border-forest-600",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className={cn("flex h-9 w-9 items-center justify-center rounded-lg", count > 0 ? "bg-amber-500 text-white" : "bg-slate-100 text-slate-500")}>
                    <c.icon className="h-4 w-4" aria-hidden />
                  </span>
                  {count > 0 && <span className="text-[11px] font-semibold uppercase tracking-wide text-amber-700">Needs attention</span>}
                </div>
                <p className="mt-3 text-3xl font-semibold tabular-nums text-slate-900">{count}</p>
                <p className="text-xs font-medium text-slate-500">{c.label}</p>
              </Link>
            );
          })}
        </div>
        {/* Totals */}
        <div className="grid grid-cols-2 gap-3 md:grid-cols-4 xl:grid-cols-8">
          {TOTALS.map((c) => (
            <Link key={c.key} href={c.href} className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 shadow-sm transition-colors hover:border-forest-600 xl:flex-col xl:items-start xl:gap-2">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-forest-50 text-forest-700">
                <c.icon className="h-4 w-4" aria-hidden />
              </span>
              <span className="min-w-0">
                <span className="block text-xl font-semibold tabular-nums text-slate-900">{s.cards[c.key] ?? 0}</span>
                <span className="block truncate text-xs text-slate-500">{c.label}</span>
              </span>
            </Link>
          ))}
        </div>
      </div>

      {s.analytics && <BookingAnalytics a={s.analytics} />}

      <div className="grid gap-6 lg:grid-cols-2 xl:grid-cols-3">
        <Card title="Recent activity">
          {s.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {s.recentActivity.slice(0, 8).map((a) => (
                <li key={a._id} className="flex gap-2">
                  <span className="mt-1.5 h-1.5 w-1.5 shrink-0 rounded-full bg-forest-600" />
                  <div className="min-w-0">
                    <p className="truncate text-slate-800">{a.summary || `${a.action} ${a.entity}`}</p>
                    <p className="text-xs text-slate-400">
                      {a.userEmail} · {formatDate(a.timestamp, "en", { dateStyle: "short", timeStyle: "short" })}
                    </p>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Latest bookings" actions={<Link href="/admin/bookings" className="text-xs text-forest-700">View all</Link>}>
          {s.recentBookings.length === 0 ? (
            <Empty>No bookings yet.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {s.recentBookings.map((b) => (
                <li key={b._id}>
                  <Link href={`/admin/bookings/${b._id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-forest-700">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">{b.customer?.name}</span>
                      <span className="block truncate text-xs text-slate-500">
                        {b.reference} · {b.itemTitle || b.type}
                      </span>
                    </span>
                    <StatusBadge status={b.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
        <Card title="Latest tailor-made enquiries" actions={<Link href="/admin/tailor-made" className="text-xs text-forest-700">View all</Link>}>
          {s.recentEnquiries.length === 0 ? (
            <Empty>No enquiries yet.</Empty>
          ) : (
            <ul className="divide-y divide-slate-100 text-sm">
              {s.recentEnquiries.map((e) => (
                <li key={e._id}>
                  <Link href={`/admin/tailor-made/${e._id}`} className="flex items-center justify-between gap-3 py-2.5 hover:text-forest-700">
                    <span className="min-w-0">
                      <span className="block truncate font-medium">
                        {e.personal?.firstName} {e.personal?.lastName}
                      </span>
                      <span className="block truncate text-xs text-slate-500">
                        {e.reference} · arrives {formatDate(e.travel?.arrivalDate)}
                      </span>
                    </span>
                    <StatusBadge status={e.status} />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </Card>
      </div>
    </div>
  );
}

function BookingAnalytics({ a }: { a: Analytics }) {
  const last = a.monthly[a.monthly.length - 1];
  const prev = a.monthly[a.monthly.length - 2];
  const thisMonth = last ? last.open + last.won + last.lost : 0;
  const lastMonth = prev ? prev.open + prev.won + prev.lost : 0;
  const delta = lastMonth ? Math.round(((thisMonth - lastMonth) / lastMonth) * 100) : null;
  const [revenue, ...otherRevenue] = a.revenue;

  return (
    <section className="space-y-6" aria-labelledby="booking-analytics">
      <div className="flex items-end justify-between gap-3">
        <div>
          <h2 id="booking-analytics" className="font-sans text-lg font-semibold tracking-tight text-slate-900">
            Booking analytics
          </h2>
          <p className="text-sm text-slate-500">Last 12 months · {a.total} requests</p>
        </div>
        <Link href="/admin/bookings" className="text-xs font-medium text-forest-700 hover:underline">
          Manage bookings →
        </Link>
      </div>

      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <Kpi icon={CalendarCheck} label={`Requests in ${last ? monthLabel(last.month) : "this month"}`} value={thisMonth}>
          {delta !== null ? (
            <span className={delta >= 0 ? "inline-flex items-center gap-1 text-emerald-700" : "inline-flex items-center gap-1 text-red-600"}>
              {delta >= 0 ? <TrendingUp className="h-3.5 w-3.5" /> : <TrendingDown className="h-3.5 w-3.5" />}
              {delta >= 0 ? "+" : ""}
              {delta}% vs {prev ? monthLabel(prev.month) : "last month"}
            </span>
          ) : (
            `${lastMonth} the month before`
          )}
        </Kpi>
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <RateRing value={a.kpis.confirmationRate} color={SERIES.aqua} label="Confirmation rate" />
        </div>
        <div className="flex items-center rounded-xl border border-slate-200 bg-white p-4 shadow-sm">
          <RateRing value={a.kpis.cancellationRate} color={SERIES.orange} label="Cancellation rate" />
        </div>
        <Kpi icon={Wallet} label="Confirmed value" value={revenue ? (formatPrice(revenue.amount, revenue.currency) ?? "—") : "—"}>
          {otherRevenue.length ? `+ ${otherRevenue.map((r) => formatPrice(r.amount, r.currency)).join(", ")}` : "Quotes on confirmed bookings"}
        </Kpi>
        <Kpi icon={Plane} label="Upcoming trips (30 days)" value={a.upcomingTrips} accent>
          Confirmed bookings starting soon
        </Kpi>
        <Kpi icon={Inbox} label="Open requests" value={a.kpis.openRequests}>
          Awaiting a reply, quote or confirmation
        </Kpi>
        <Kpi icon={Users} label="Travellers" value={a.kpis.travellers}>
          Avg. group size {a.kpis.avgGroupSize}
        </Kpi>
        <Kpi icon={UserRound} label="Registered customers" value={a.registeredCustomers}>
          {a.kpis.accountShare}% of requests from signed-in accounts
        </Kpi>
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Booking requests by month" className="xl:col-span-2">
          <StackedColumns
            data={a.monthly}
            series={(["won", "open", "lost"] as const).map((key) => ({ key, label: OUTCOME[key].label, color: OUTCOME[key].color }))}
          />
        </Card>
        <Card title="Status pipeline">
          <BarList
            items={a.byStatus.map((b) => ({ label: b.status, count: b.count, color: OUTCOME[OUTCOME_OF[b.status] ?? "open"].color }))}
            renderLabel={(l) => <StatusBadge status={l} />}
            empty="No bookings in the last 12 months."
          />
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
        <Card title="What customers book">
          <BarList items={a.byType.map((t) => ({ label: TYPE_LABEL[t.label] ?? t.label, count: t.count }))} />
        </Card>
        <Card title="Most requested tours & vehicles">
          <BarList items={a.topItems} empty="No tour, excursion or vehicle bookings yet." />
        </Card>
        <Card title="Top source countries">
          <BarList items={a.topCountries} empty="No countries shared yet." />
        </Card>
      </div>
    </section>
  );
}

function Kpi({ icon: Icon, label, value, accent, children }: { icon: typeof Users; label: string; value: number | string; accent?: boolean; children?: ReactNode }) {
  return (
    <div className={accent ? "rounded-xl bg-forest-800 p-4 text-white shadow-sm" : "rounded-xl border border-slate-200 bg-white p-4 shadow-sm"}>
      <div className="flex items-center justify-between gap-2">
        <p className={accent ? "text-xs font-medium uppercase tracking-wide text-white/70" : "text-xs font-medium uppercase tracking-wide text-slate-500"}>{label}</p>
        <Icon className={accent ? "h-4 w-4 shrink-0 text-gold-400" : "h-4 w-4 shrink-0 text-slate-400"} />
      </div>
      <p className={accent ? "mt-2 text-3xl font-semibold tabular-nums" : "mt-2 text-3xl font-semibold tabular-nums text-slate-900"}>{value}</p>
      {children && <p className={accent ? "mt-1 text-xs text-white/70" : "mt-1 text-xs text-slate-500"}>{children}</p>}
    </div>
  );
}
