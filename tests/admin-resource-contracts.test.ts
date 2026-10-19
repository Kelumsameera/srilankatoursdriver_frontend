import { describe, expect, it } from "vitest";
import { RESOURCES } from "@/features/admin/resources";
import { allFields, fromFormValues, toFormValues } from "@/components/admin/form/values";
import * as schemas from "../../backend/src/validations/content";
type SchemaName = { [K in keyof typeof schemas]: (typeof schemas)[K] extends { safeParse: unknown } ? K : never }[keyof typeof schemas];

const schemaNames: Record<string, SchemaName> = {
  tours: "tourCreate", destinations: "destinationCreate", excursions: "excursionCreate", vehicles: "vehicleCreate",
  gallery: "galleryCreate", blog: "blogCreate", reviews: "reviewCreate", testimonials: "reviewCreate", faqs: "faqCreate",
  hero: "heroCreate", navigation: "navigationCreate", seo: "seoMetadataCreate", "guest-shorts": "guestShortCreate",
  comments: "commentCreate", stories: "storyCreate",
};

describe("admin CMS form/API contracts (no database writes)", () => {
  for (const [key, resource] of Object.entries(RESOURCES)) {
    it(`${key}: serializes a valid create payload accepted by the API`, () => {
      const schemaName = key.endsWith("-categories") ? "categoryCreate" : schemaNames[key];
      const schema = schemas[schemaName];
      expect(schema, `${key} has an API schema`).toBeDefined();
      const fields = allFields(resource.sections);
      const values = toFormValues(fields, { ...resource.defaults, ...resource.fixedValues });
      for (const field of fields) {
        if (!field.required || values[field.name]) continue;
        values[field.name] = field.type === "number" ? 1 : field.type === "media"
          ? { publicId: "qa/image", url: "https://example.com/image.jpg", resourceType: "image" }
          : field.type === "url" ? "https://www.youtube.com/watch?v=dQw4w9WgXc"
          : field.type === "relation" ? "0123456789abcdef01234567" : "audit-content";
      }
      if (key === "gallery") values.media = { publicId: "qa/image", url: "https://example.com/image.jpg", resourceType: "image" };
      const payload = { ...fromFormValues(fields, values), ...resource.fixedValues };
      const result = schema.safeParse(payload);
      expect(result.success, result.success ? "" : JSON.stringify(result.error.issues)).toBe(true);
    });
  }

  it("opens date fields safely when legacy records contain invalid dates", () => {
    const fields = [{ name: "date", label: "Date", type: "date" as const }];
    expect(toFormValues(fields, { date: "invalid-date" })).toEqual({ date: "" });
    expect(toFormValues(fields, { date: "2026-10-15T00:00:00.000Z" })).toEqual({ date: "2026-10-15" });
  });

  it("initializes missing text defaults while preserving stored values and explicit clearing", () => {
    const fields = [{ name: "currency", label: "Currency", type: "text" as const, defaultValue: "USD" }];
    expect(toFormValues(fields, {})).toEqual({ currency: "USD" });
    expect(toFormValues(fields, { currency: "LKR" })).toEqual({ currency: "LKR" });
    expect(toFormValues(fields, { currency: "" })).toEqual({ currency: "" });
  });
});

