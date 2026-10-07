"use client";

import { use } from "react";
import { CrmDetail, Detail } from "@/components/admin/CrmDetail";
import { Card } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

type Rec = Record<string, unknown>;

export default function TailorMadeDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  return (
    <CrmDetail
      id={id}
      endpoint="/admin/tailor-made-enquiries"
      listHref="/admin/tailor-made"
      listLabel="Tailor-made enquiries"
      permission="enquiries"
      statuses={["new", "processing", "quoted", "confirmed", "closed"]}
      title={(r) => `Tailor-made – ${(r.personal as Rec)?.firstName ?? ""} ${(r.personal as Rec)?.lastName ?? ""}`}
      contact={(r) => {
        const p = (r.personal ?? {}) as Record<string, string>;
        return { email: p.email, phone: p.phone, whatsapp: p.whatsapp, name: p.firstName };
      }}
    >
      {(r) => {
        const p = (r.personal ?? {}) as Record<string, string>;
        const t = (r.travel ?? {}) as Rec;
        const tr = (r.travelers ?? {}) as Rec;
        const a = (r.arrival ?? {}) as Rec;
        const d = (r.departure ?? {}) as Rec;
        const h = (r.hotels ?? {}) as Rec;
        const v = (r.vehicle ?? {}) as Rec;
        const b = (r.budget ?? {}) as Rec;
        const transfer = (x: Rec) => [x.airport, x.flightNumber, x.time, x.needsTransfer ? "transfer needed" : null].filter(Boolean).join(" · ");
        return (
          <>
            <Card title="1. Personal information">
              <Detail rows={[["Name", `${p.firstName} ${p.lastName ?? ""}`], ["Email", p.email], ["Phone", p.phone], ["WhatsApp", p.whatsapp], ["Country", p.country], ["Language", String(r.locale ?? "").toUpperCase()]]} />
            </Card>
            <Card title="2–5. Dates, travellers, arrival & departure">
              <Detail
                rows={[
                  ["Arrival date", formatDate(t.arrivalDate as string, "en", { dateStyle: "full" })],
                  ["Departure date", formatDate(t.departureDate as string, "en", { dateStyle: "full" })],
                  ["Duration", t.durationDays ? `${t.durationDays} days` : ""],
                  ["Flexible dates", t.flexibleDates ? "Yes" : "No"],
                  ["Adults", String(tr.adults ?? "")],
                  ["Children", tr.children ? String(tr.children) : ""],
                  ["Infants", tr.infants ? String(tr.infants) : ""],
                  ["Children's ages", String(tr.childAges ?? "")],
                  ["Arrival", transfer(a)],
                  ["Departure", transfer(d)],
                ]}
              />
            </Card>
            <Card title="6–11. Preferences">
              <Detail
                rows={[
                  ["Destinations", ((r.destinations as { name: string }[]) ?? []).map((x) => x.name).join(", ")],
                  ["Other places / ideas", String(r.otherDestinations ?? "")],
                  ["Interests", ((r.interests as string[]) ?? []).join(", ")],
                  ["Hotels", [h.category, h.roomType, h.notes].filter(Boolean).join(" · ")],
                  ["Vehicle", [(v.vehicleRef as { name?: string } | null)?.name, v.preference].filter(Boolean).join(" · ")],
                  ["Budget", b.amount ? `${b.amount} ${b.currency}${b.perPerson ? " per person" : " total"}` : String(b.range ?? "")],
                  ["Additional requirements", String(r.additionalRequirements ?? "")],
                ]}
              />
            </Card>
          </>
        );
      }}
    </CrmDetail>
  );
}
