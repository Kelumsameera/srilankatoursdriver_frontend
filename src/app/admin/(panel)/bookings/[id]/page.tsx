"use client";

import { use } from "react";
import Link from "next/link";
import { CrmDetail, Detail } from "@/components/admin/CrmDetail";
import { Card } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

type Ref = { _id: string; title?: string; name?: string } | null;

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CrmDetail
      id={id}
      endpoint="/admin/bookings"
      listHref="/admin/bookings"
      listLabel="Bookings"
      permission="bookings"
      statuses={["new", "contacted", "quoted", "pending", "confirmed", "cancelled", "completed"]}
      title={(r) => `Booking – ${(r.customer as { name?: string })?.name ?? ""}`}
      contact={(r) => r.customer as { email?: string; phone?: string; whatsapp?: string; name?: string }}
    >
      {(r) => {
        const c = (r.customer ?? {}) as Record<string, string>;
        const item = (r.tour ?? r.excursion ?? r.vehicle) as Ref;
        const href = r.tour ? `/admin/content/tours/${item?._id}` : r.excursion ? `/admin/content/excursions/${item?._id}` : r.vehicle ? `/admin/content/vehicles/${item?._id}` : null;
        return (
          <>
            <Card title="Trip">
              <Detail
                rows={[
                  ["Type", String(r.type)],
                  ["Booking for", href ? <Link className="text-forest-700 underline" href={href}>{String(r.itemTitle || item?.title || item?.name)}</Link> : String(r.itemTitle || "General trip")],
                  ["Start date", formatDate(r.startDate as string, "en", { dateStyle: "full" })],
                  ["End date", formatDate(r.endDate as string, "en", { dateStyle: "full" })],
                  ["Adults", String(r.adults ?? "")],
                  ["Children", r.children ? String(r.children) : ""],
                  ["Pickup", String(r.pickupLocation ?? "")],
                  ["Language", String(r.locale ?? "").toUpperCase()],
                  ["Message", String(r.message ?? "")],
                ]}
              />
            </Card>
            <Card title="Guest">
              <Detail rows={[["Name", c.name], ["Email", c.email], ["Phone", c.phone], ["WhatsApp", c.whatsapp], ["Country", c.country]]} />
            </Card>
          </>
        );
      }}
    </CrmDetail>
  );
}
