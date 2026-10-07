"use client";

import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/admin/api";
import { Empty, ErrorBlock, LoadingBlock, PageHeader, StatusBadge } from "@/components/admin/ui";

interface TourRow {
  _id: string;
  title: string;
  status: string;
  durationDays?: number;
  itinerary?: { day: number; title: string }[];
}

/** Overview of every tour's day-by-day itinerary; editing happens in the tour editor. */
export default function ItinerariesPage() {
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["itineraries"],
    queryFn: async () => {
      const list = await api.get<TourRow[]>("/admin/tours?limit=100");
      return Promise.all(list.data.map((t) => api.get<TourRow>(`/admin/tours/${t._id}`).then((r) => r.data)));
    },
  });
  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const tours = data ?? [];
  return (
    <div>
      <PageHeader title="Itineraries" description="Day-by-day plans for every tour. Click a tour to edit its itinerary (unlimited days)." />
      {tours.length === 0 ? (
        <Empty>No tours yet.</Empty>
      ) : (
        <div className="grid gap-4 md:grid-cols-2">
          {tours.map((t) => (
            <Link key={t._id} href={`/admin/content/tours/${t._id}`} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm hover:border-forest-600">
              <div className="flex items-start justify-between gap-3">
                <h2 className="font-sans text-base font-semibold">{t.title}</h2>
                <StatusBadge status={t.status} />
              </div>
              <p className="mt-1 text-xs text-slate-500">
                {t.itinerary?.length ?? 0} itinerary days · {t.durationDays ?? 0} day tour
              </p>
              <ol className="mt-3 space-y-1 text-sm text-slate-600">
                {(t.itinerary ?? []).slice(0, 6).map((d) => (
                  <li key={d.day} className="truncate">
                    <span className="font-medium text-forest-700">Day {d.day}:</span> {d.title}
                  </li>
                ))}
                {(t.itinerary?.length ?? 0) > 6 && <li className="text-xs text-slate-400">+ {t.itinerary!.length - 6} more</li>}
              </ol>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
