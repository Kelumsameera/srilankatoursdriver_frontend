import { describe, expect, it } from "vitest";
import { bookingSchema, clean, contactSchema, tailorMadeSchema, type ValidationMessages } from "@/validations/public";
import { fromFormValues, toFormValues } from "@/components/admin/form/values";
import type { FieldDef } from "@/components/admin/form/types";

const m: ValidationMessages = {
  required: "required",
  email: "email",
  minLength: (n) => `min ${n}`,
  min: (n) => `>= ${n}`,
  future: "future",
  after: "after",
  select: "select",
};
const day = (offset: number) => new Date(Date.now() + offset * 86_400_000).toISOString().slice(0, 10);

describe("public booking form", () => {
  const ok = { type: "general" as const, customer: { name: "Jane", email: "jane@example.com" }, startDate: day(10), adults: 2 };
  it("accepts a valid request", () => expect(bookingSchema(m).safeParse(ok).success).toBe(true));
  it("requires the selected item for tour bookings", () => {
    const r = bookingSchema(m).safeParse({ ...ok, type: "tour" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]).toMatchObject({ path: ["tour"], message: "select" });
  });
  it("rejects past dates and end-before-start", () => {
    expect(bookingSchema(m).safeParse({ ...ok, startDate: day(-5) }).error!.issues[0].message).toBe("future");
    expect(bookingSchema(m).safeParse({ ...ok, endDate: day(2) }).error!.issues[0].message).toBe("after");
  });
});

describe("tailor-made form", () => {
  const ok = {
    personal: { firstName: "Max", email: "max@example.de" },
    travel: { arrivalDate: day(30), departureDate: day(40) },
    travelers: { adults: 2 },
    arrival: {},
    departure: {},
    destinations: [],
    interests: ["culture"],
    hotels: { category: "boutique" as const },
    vehicle: {},
    budget: { currency: "EUR" },
  };
  it("accepts a valid enquiry", () => expect(tailorMadeSchema(m).safeParse(ok).success).toBe(true));
  it("requires departure after arrival", () => {
    const r = tailorMadeSchema(m).safeParse({ ...ok, travel: { arrivalDate: day(30), departureDate: day(30) } });
    expect(r.error!.issues[0].path).toEqual(["travel", "departureDate"]);
  });
});

describe("contact form", () => {
  it("requires a meaningful message", () => {
    expect(contactSchema(m).safeParse({ name: "Al", email: "a@b.co", message: "short" }).success).toBe(false);
  });
});

describe("clean()", () => {
  it("drops empty strings and NaN recursively", () => {
    expect(clean({ a: "", b: 1, c: Number.NaN, d: { e: "", f: "x" } })).toEqual({ b: 1, d: { f: "x" } });
  });
});

describe("admin form value mapping", () => {
  const fields: FieldDef[] = [
    { name: "title", label: "Title", type: "text" },
    { name: "price", label: "Price", type: "number", nullable: true },
    { name: "order", label: "Order", type: "number" },
    { name: "category", label: "Category", type: "relation", endpoint: "/x", labelKey: "name" },
    { name: "destinations", label: "D", type: "relation", endpoint: "/x", labelKey: "name", multiple: true },
    { name: "highlights", label: "H", type: "list" },
    { name: "startDate", label: "S", type: "date" },
    { name: "itinerary", label: "I", type: "objectList", fields: [{ name: "day", label: "Day", type: "number" }, { name: "title", label: "T", type: "text" }] },
  ];

  it("maps API data to form values (populated refs → ids, dates → yyyy-mm-dd)", () => {
    const v = toFormValues(fields, {
      title: "T",
      price: null,
      category: { _id: "c1", name: "Cat" },
      destinations: [{ _id: "d1" }, "d2"],
      startDate: "2026-12-24T00:00:00.000Z",
      itinerary: [{ _id: "x", day: 1, title: "Arrive" }],
    });
    expect(v).toMatchObject({ category: "c1", destinations: ["d1", "d2"], startDate: "2026-12-24", price: "", highlights: [] });
    expect((v.itinerary as unknown[])[0]).toMatchObject({ _id: "x", day: 1, title: "Arrive" });
  });

  it("maps form values back to an API payload", () => {
    const p = fromFormValues(fields, {
      title: "T",
      price: "",
      order: "",
      category: "",
      destinations: ["d1"],
      highlights: ["a", "", " b "],
      startDate: "",
      itinerary: [{ day: "2", title: "X" }],
    });
    expect(p).toMatchObject({ price: null, category: null, destinations: ["d1"], highlights: ["a", "b"], startDate: null, itinerary: [{ day: 2, title: "X" }] });
    expect(p.order).toBeUndefined();
  });
});
