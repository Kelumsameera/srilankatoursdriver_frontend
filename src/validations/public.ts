import { z } from "zod";

/** Messages are injected so validation errors appear in the visitor's language. */
export interface ValidationMessages {
  required: string;
  email: string;
  minLength: (min: number) => string;
  min: (min: number) => string;
  future: string;
  after: string;
  select: string;
}

const today = () => {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  return d;
};

const phone = z
  .string()
  .trim()
  .max(30)
  .regex(/^[+\d][\d\s()-]*$|^$/)
  .optional();

const optionalInt = z.number().int().min(0).max(100).optional().or(z.nan().transform(() => undefined));

export function bookingSchema(m: ValidationMessages) {
  return z
    .object({
      type: z.enum(["general", "tour", "excursion", "vehicle"]),
      tour: z.string().optional(),
      excursion: z.string().optional(),
      vehicle: z.string().optional(),
      customer: z.object({
        name: z.string().trim().min(2, m.minLength(2)),
        email: z.string().trim().email(m.email),
        phone,
        whatsapp: phone,
        country: z.string().trim().max(80).optional(),
      }),
      startDate: z.string().min(1, m.required),
      endDate: z.string().optional(),
      adults: z.number({ error: m.required }).int().min(1, m.min(1)).max(100),
      children: optionalInt,
      pickupLocation: z.string().max(200).optional(),
      message: z.string().max(3000).optional(),
      website: z.string().max(0).optional(),
    })
    .superRefine((v, ctx) => {
      if (v.type !== "general" && !v[v.type]) ctx.addIssue({ code: "custom", path: [v.type], message: m.select });
      if (v.startDate && new Date(v.startDate) < today()) ctx.addIssue({ code: "custom", path: ["startDate"], message: m.future });
      if (v.startDate && v.endDate && new Date(v.endDate) < new Date(v.startDate)) ctx.addIssue({ code: "custom", path: ["endDate"], message: m.after });
    });
}
export type BookingValues = z.input<ReturnType<typeof bookingSchema>>;

export function tailorMadeSchema(m: ValidationMessages) {
  const transfer = z.object({
    airport: z.string().max(120).optional(),
    flightNumber: z.string().max(20).optional(),
    time: z.string().max(20).optional(),
    needsTransfer: z.boolean().optional(),
  });
  return z
    .object({
      personal: z.object({
        firstName: z.string().trim().min(1, m.required),
        lastName: z.string().trim().max(80).optional(),
        email: z.string().trim().email(m.email),
        phone,
        whatsapp: phone,
        country: z.string().trim().max(80).optional(),
      }),
      travel: z.object({
        arrivalDate: z.string().min(1, m.required),
        departureDate: z.string().min(1, m.required),
        flexibleDates: z.boolean().optional(),
      }),
      travelers: z.object({
        adults: z.number({ error: m.required }).int().min(1, m.min(1)).max(100),
        children: optionalInt,
        infants: optionalInt,
        childAges: z.string().max(120).optional(),
      }),
      arrival: transfer,
      departure: transfer,
      destinations: z.array(z.string()).max(40),
      otherDestinations: z.string().max(1000).optional(),
      interests: z.array(z.string()).max(30),
      hotels: z.object({
        category: z.enum(["budget", "standard", "boutique", "luxury", "mixed"]),
        roomType: z.string().max(120).optional(),
        notes: z.string().max(1000).optional(),
      }),
      vehicle: z.object({ vehicleRef: z.string().optional(), preference: z.string().max(200).optional() }),
      budget: z.object({
        amount: z.number().min(0).optional().or(z.nan().transform(() => undefined)),
        currency: z.string().length(3),
        perPerson: z.boolean().optional(),
        range: z.string().max(80).optional(),
      }),
      additionalRequirements: z.string().max(5000).optional(),
      website: z.string().max(0).optional(),
    })
    .superRefine((v, ctx) => {
      if (v.travel.arrivalDate && new Date(v.travel.arrivalDate) < today())
        ctx.addIssue({ code: "custom", path: ["travel", "arrivalDate"], message: m.future });
      if (v.travel.arrivalDate && v.travel.departureDate && new Date(v.travel.departureDate) <= new Date(v.travel.arrivalDate))
        ctx.addIssue({ code: "custom", path: ["travel", "departureDate"], message: m.after });
    });
}
export type TailorMadeValues = z.input<ReturnType<typeof tailorMadeSchema>>;

export function contactSchema(m: ValidationMessages) {
  return z.object({
    name: z.string().trim().min(2, m.minLength(2)),
    email: z.string().trim().email(m.email),
    phone,
    subject: z.string().max(200).optional(),
    message: z.string().trim().min(10, m.minLength(10)).max(5000),
    website: z.string().max(0).optional(),
  });
}
export type ContactValues = z.input<ReturnType<typeof contactSchema>>;

export function reviewSchema(m: ValidationMessages) {
  return z.object({
    guestName: z.string().trim().min(2, m.minLength(2)),
    email: z.string().trim().email(m.email),
    country: z.string().max(80).optional(),
    rating: z.number().int().min(1, m.select).max(5),
    title: z.string().max(200).optional(),
    review: z.string().trim().min(20, m.minLength(20)).max(5000),
    website: z.string().max(0).optional(),
  });
}
export type ReviewValues = z.input<ReturnType<typeof reviewSchema>>;

/** Removes empty strings / undefined so optional API fields are omitted. */
export function clean<T>(value: T): T {
  if (Array.isArray(value)) return value.map(clean) as T;
  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value as Record<string, unknown>)
        .filter(([, v]) => v !== "" && v !== undefined && !(typeof v === "number" && Number.isNaN(v)))
        .map(([k, v]) => [k, clean(v)]),
    ) as T;
  }
  return value;
}
