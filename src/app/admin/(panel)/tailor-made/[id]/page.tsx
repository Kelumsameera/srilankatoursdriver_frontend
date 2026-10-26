"use client";

import { use } from "react";
import { CrmDetail, Detail } from "@/components/admin/CrmDetail";
import { Card } from "@/components/admin/ui";
import { formatDate } from "@/lib/utils";

type Rec = Record<string, unknown>;

/** English labels of the public form's choice keys (older enquiries keep their free-text values). */
const LABELS: Record<string, string> = {
  alone: "Alone",
  couple: "As a couple",
  family: "With the family",
  friends: "With friends",
  car: "Car",
  van: "Van",
  bus: "Bus",
  driver: "Driver and vehicle only",
  driverGuide: "Driver, vehicle with a guide",
  nature: "Nature, wildlife & safari",
  culture: "Cultural & heritage",
  beach: "Beach relaxing",
  trekking: "Trekking & climbing",
  activity: "Activity and game",
  boat: "Boat trips & island visits",
  train: "Train rides",
  factory: "Factory visits",
  waterSports: "Water sports",
  diving: "Snorkelling & diving",
  whales: "Whales and dolphins",
  "3star": "3 star",
  "4star": "4 star",
  "5star": "5 star",
  own: "Arranges own accommodation",
  bb: "Bed & breakfast (B/B)",
  hb: "Half board (H/B)",
  fb: "Full board (F/B)",
  trainTickets: "Train tickets",
  entranceTickets: "Entrance & activity tickets",
  airportTransfer: "Airport transfer",
};
const label = (v: unknown) => (typeof v === "string" ? (LABELS[v] ?? v) : "");
const labels = (v: unknown) => ((v as string[] | undefined) ?? []).map(label).join(", ");

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
        const trip = (r.trip ?? {}) as Rec;
        const transfer = (x: Rec) => [x.airport, x.flightNumber, x.time, x.needsTransfer ? "transfer needed" : null].filter(Boolean).join(" · ");
        return (
          <>
            <Card title="Contact">
              <Detail rows={[["Name", `${p.firstName} ${p.lastName ?? ""}`], ["Email", p.email], ["WhatsApp", p.whatsapp], ["Phone", p.phone], ["Country", p.country], ["Language", String(r.locale ?? "").toUpperCase()]]} />
            </Card>
            <Card title="Travellers & dates">
              <Detail
                rows={[
                  ["Start date", formatDate(t.arrivalDate as string, "en", { dateStyle: "full" })],
                  ["End date", formatDate(t.departureDate as string, "en", { dateStyle: "full" })],
                  ["Duration", t.durationDays ? `${t.durationDays} days` : ""],
                  ["Flexible dates", t.flexibleDates ? "Yes" : ""],
                  ["Adults", String(tr.adults ?? "")],
                  ["Children", tr.children ? String(tr.children) : ""],
                  ["Infants", tr.infants ? String(tr.infants) : ""],
                  ["Children's ages", String(tr.childAges ?? "")],
                  ["Arrival", transfer(a)],
                  ["Departure", transfer(d)],
                ]}
              />
            </Card>
            <Card title="Preferences">
              <Detail
                rows={[
                  ["How they travel", label(trip.travelType)],
                  ["Vehicle type", label(trip.vehicleType)],
                  ["Transportation", label(trip.transportMethod)],
                  ["Holiday types", labels(r.interests)],
                  ["Accommodation", label(r.accommodation)],
                  ["Meal plan", label(r.mealPlan)],
                  ["Additional services", labels(r.services)],
                  ["Additional requirements", String(r.additionalRequirements ?? "")],
                  // Fields of the older, longer form.
                  ["Destinations", ((r.destinations as { name: string }[]) ?? []).map((x) => x.name).join(", ")],
                  ["Other places / ideas", String(r.otherDestinations ?? "")],
                  ["Hotels", [h.category, h.roomType, h.notes].filter(Boolean).join(" · ")],
                  ["Vehicle", [(v.vehicleRef as { name?: string } | null)?.name, v.preference].filter(Boolean).join(" · ")],
                  ["Budget", b.amount ? `${b.amount} ${b.currency}${b.perPerson ? " per person" : " total"}` : String(b.range ?? "")],
                ]}
              />
            </Card>
          </>
        );
      }}
    </CrmDetail>
  );
}
