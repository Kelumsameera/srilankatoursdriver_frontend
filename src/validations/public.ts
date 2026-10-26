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
      /** One age per child; checked below against the number of children (stale extra entries are ignored). */
      childrenAges: z.array(z.number().or(z.nan())).optional(),
      pickupLocation: z.string().max(200).optional(),
      message: z.string().max(3000).optional(),
      website: z.string().max(0).optional(),
    })
    .superRefine((v, ctx) => {
      if (v.type !== "general" && !v[v.type]) ctx.addIssue({ code: "custom", path: [v.type], message: m.select });
      if (v.startDate && new Date(v.startDate) < today()) ctx.addIssue({ code: "custom", path: ["startDate"], message: m.future });
      if (v.startDate && v.endDate && new Date(v.endDate) < new Date(v.startDate)) ctx.addIssue({ code: "custom", path: ["endDate"], message: m.after });
      for (let i = 0; i < Math.min(v.children ?? 0, MAX_CHILD_AGES); i++) {
        const age = v.childrenAges?.[i];
        if (!(typeof age === "number" && Number.isInteger(age) && age >= 0 && age <= MAX_CHILD_AGE)) ctx.addIssue({ code: "custom", path: ["childrenAges", i], message: m.required });
      }
    });
}
/** Oldest age that counts as a child, and how many age fields the form shows at most. */
export const MAX_CHILD_AGE = 17;
export const MAX_CHILD_AGES = 20;
export type BookingValues = z.input<ReturnType<typeof bookingSchema>>;

/** Choices of the tailor-made form; the same keys are accepted by the API. */
export const TRAVEL_TYPES = ["alone", "couple", "family", "friends"] as const;
export const VEHICLE_TYPES = ["car", "van", "bus"] as const;
export const TRANSPORT_METHODS = ["driver", "driverGuide"] as const;
export const HOLIDAY_TYPES = ["nature", "culture", "beach", "trekking", "activity", "boat", "train", "factory", "waterSports", "diving", "whales"] as const;
export const ACCOMMODATION_TYPES = ["3star", "4star", "5star", "own"] as const;
export const MEAL_PLANS = ["bb", "hb", "fb"] as const;
export const EXTRA_SERVICES = ["trainTickets", "entranceTickets", "airportTransfer"] as const;

/** A select that starts on "select.." (empty) but must end up on one of the choices. */
const choice = <T extends readonly [string, ...string[]]>(values: T, m: ValidationMessages) =>
  z.union([z.enum(values), z.literal("")]).refine((v) => v !== "", m.select);

export function tailorMadeSchema(m: ValidationMessages) {
  return z
    .object({
      trip: z.object({
        travelType: choice(TRAVEL_TYPES, m),
        vehicleType: choice(VEHICLE_TYPES, m),
        transportMethod: choice(TRANSPORT_METHODS, m),
      }),
      interests: z.array(z.enum(HOLIDAY_TYPES)).min(1, m.select),
      accommodation: choice(ACCOMMODATION_TYPES, m),
      mealPlan: z.union([z.enum(MEAL_PLANS), z.literal("")]).optional(),
      services: z.array(z.enum(EXTRA_SERVICES)),
      additionalRequirements: z.string().max(5000).optional(),
      travelers: z.object({
        adults: z.number({ error: m.required }).int().min(1, m.min(1)).max(100),
        children: optionalInt,
      }),
      travel: z.object({
        arrivalDate: z.string().min(1, m.required),
        departureDate: z.string().min(1, m.required),
      }),
      personal: z.object({
        firstName: z.string().trim().min(2, m.minLength(2)).max(80),
        email: z.string().trim().email(m.email),
      }),
      /** WhatsApp: country (for its dial code) + number, joined into personal.whatsapp on submit. */
      whatsappCountry: z.string().min(1, m.select),
      whatsappNumber: z
        .string()
        .trim()
        .min(1, m.required)
        .regex(/^[\d\s()-]{5,20}$/, m.minLength(5)),
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
