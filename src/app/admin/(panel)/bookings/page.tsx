"use client";

import { Suspense } from "react";
import { CrmList } from "@/components/admin/CrmList";
import { formatDate } from "@/lib/utils";

export default function BookingsPage() {
  return (
    <Suspense>
      <CrmList
        title="Bookings"
        description="Booking requests from the website. Update status, assign, quote, add notes and export."
        endpoint="/admin/bookings"
        detailBase="/admin/bookings"
        permission="bookings"
        exportName="bookings"
        statuses={["new", "contacted", "quoted", "pending", "confirmed", "cancelled", "completed"]}
        typeFilter={[
          { value: "tour", label: "Tours" },
          { value: "excursion", label: "Excursions" },
          { value: "vehicle", label: "Vehicles" },
          { value: "general", label: "General" },
        ]}
        columns={[
          { label: "Guest", render: (r) => String((r.customer as { name?: string })?.name ?? "") },
          { label: "Reference", render: (r) => <span className="font-mono text-xs">{String(r.reference)}</span> },
          { label: "For", render: (r) => String(r.itemTitle || r.type) },
          { label: "Travel date", render: (r) => formatDate(r.startDate as string) },
          { label: "Pax", render: (r) => `${r.adults ?? 0}${r.children ? ` + ${r.children}` : ""}` },
          { label: "Assigned", render: (r) => (r.assignedTo as { name?: string } | null)?.name ?? "—" },
        ]}
      />
    </Suspense>
  );
}
