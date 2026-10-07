"use client";

import { Suspense } from "react";
import { CrmList } from "@/components/admin/CrmList";
import { formatDate } from "@/lib/utils";

export default function TailorMadePage() {
  return (
    <Suspense>
      <CrmList
        title="Tailor-Made Enquiries"
        description="Multi-step tailor-made tour requests from the website."
        endpoint="/admin/tailor-made-enquiries"
        detailBase="/admin/tailor-made"
        permission="enquiries"
        exportName="tailor-made-enquiries"
        statuses={["new", "processing", "quoted", "confirmed", "closed"]}
        columns={[
          { label: "Guest", render: (r) => `${(r.personal as { firstName?: string })?.firstName ?? ""} ${(r.personal as { lastName?: string })?.lastName ?? ""}` },
          { label: "Reference", render: (r) => <span className="font-mono text-xs">{String(r.reference)}</span> },
          { label: "Arrival", render: (r) => formatDate((r.travel as { arrivalDate?: string })?.arrivalDate) },
          { label: "Days", render: (r) => String((r.travel as { durationDays?: number })?.durationDays ?? "—") },
          { label: "Travellers", render: (r) => String((r.travelers as { adults?: number })?.adults ?? "") },
          { label: "Country", render: (r) => String((r.personal as { country?: string })?.country ?? "—") },
        ]}
      />
    </Suspense>
  );
}
