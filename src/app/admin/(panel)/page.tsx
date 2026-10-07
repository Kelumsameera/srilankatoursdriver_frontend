"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { CalendarCheck, Car, FileText, Image as ImageIcon, Map, MapPin, MessageSquare, Star, Wand2, CheckCircle2, Inbox, Sparkles } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { formatDate } from "@/lib/utils";
import { Card, Empty, ErrorBlock, LoadingBlock, PageHeader, StatusBadge } from "@/components/admin/ui";

interface Stats {
  cards: Record<string, number>;
  recentBookings: { _id: string; reference: string; customer?: { name?: string }; itemTitle?: string; type: string; status: string; createdAt: string }[];
  recentEnquiries: { _id: string; reference: string; personal?: { firstName?: string; lastName?: string }; travel?: { arrivalDate?: string }; status: string; createdAt: string }[];
  recentActivity: { _id: string; userEmail: string; action: string; entity: string; summary: string; timestamp: string }[];
  bookingsByMonth: { month: string; count: number }[];
}

const CARDS = [
  { key: "totalTours", label: "Total Tours", icon: Map, href: "/admin/content/tours" },
  { key: "totalDestinations", label: "Total Destinations", icon: MapPin, href: "/admin/content/destinations" },
  { key: "totalVehicles", label: "Total Vehicles", icon: Car, href: "/admin/content/vehicles" },
  { key: "totalBookings", label: "Total Bookings", icon: CalendarCheck, href: "/admin/bookings" },
  { key: "newBookings", label: "New Bookings", icon: Inbox, href: "/admin/bookings?status=new", accent: true },
  { key: "confirmedBookings", label: "Confirmed Bookings", icon: CheckCircle2, href: "/admin/bookings?status=confirmed" },
  { key: "tailorMadeEnquiries", label: "Tailor-Made Enquiries", icon: Wand2, href: "/admin/tailor-made" },
  { key: "galleryItems", label: "Gallery Items", icon: ImageIcon, href: "/admin/content/gallery" },
  { key: "blogPosts", label: "Blog Posts", icon: FileText, href: "/admin/content/blog" },
  { key: "reviews", label: "Reviews", icon: Star, href: "/admin/content/reviews" },
  { key: "pendingReviews", label: "Pending Reviews", icon: Sparkles, href: "/admin/content/reviews", accent: true },
  { key: "newMessages", label: "New Messages", icon: MessageSquare, href: "/admin/messages", accent: true },
];

export default function DashboardPage() {
  const { user, can } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["dashboard"], queryFn: () => api.get<Stats>("/admin/dashboard"), enabled: can("dashboard:read") });

  if (!can("dashboard:read")) return <PageHeader title={`Welcome, ${user?.name}`} description="Use the menu to manage the content you have access to." />;
  if (isLoading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const s = data.data;
  const max = Math.max(1, ...s.bookingsByMonth.map((b) => b.count));

  return (
    <div className="space-y-6">
      <PageHeader title={`Welcome back, ${user?.name?.split(" ")[0] ?? ""}`} description="Overview of your website and CRM." />
      <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-4" data-testid="dashboard-cards">
        {CARDS.map((c) => (
          <Link key={c.key} href={c.href} className="group rounded-xl border border-slate-200 bg-white p-4 shadow-sm transition-colors hover:border-forest-600">
            <div className="flex items-center justify-between">
              <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{c.label}</p>
              <c.icon className={c.accent && s.cards[c.key] ? "h-4 w-4 text-amber-500" : "h-4 w-4 text-slate-400"} />
            </div>
            <p className="mt-2 text-3xl font-semibold text-slate-900">{s.cards[c.key] ?? 0}</p>
          </Link>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-3">
        <Card title="Bookings – last 12 months" className="xl:col-span-2">
          <div className="flex h-40 items-end gap-2">
            {s.bookingsByMonth.map((b) => (
              <div key={b.month} className="flex flex-1 flex-col items-center gap-1">
                <span className="text-[10px] text-slate-500">{b.count || ""}</span>
                <div className="w-full rounded-t bg-forest-600/80" style={{ height: `${(b.count / max) * 100}%`, minHeight: b.count ? 4 : 1 }} title={`${b.month}: ${b.count}`} />
                <span className="text-[10px] text-slate-400">{b.month.slice(5)}</span>
              </div>
            ))}
          </div>
        </Card>
        <Card title="Recent activity">
          {s.recentActivity.length === 0 ? (
            <p className="text-sm text-slate-500">No activity yet.</p>
          ) : (
            <ul className="space-y-3 text-sm">
              {s.recentActivity.map((a) => (
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
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
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
