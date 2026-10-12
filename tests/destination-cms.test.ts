import { describe, expect, it } from "vitest";
import { RESOURCES } from "@/features/admin/resources";
import { allFields, fromFormValues, toFormValues } from "@/components/admin/form/values";

describe("destination CMS serialization", () => {
  const fields = allFields(RESOURCES.destinations.sections);
  it("preserves existing content and experience ids/media through an edit", () => {
    const data = { name: "Anuradhapura", slug: "anuradhapura", description: "Existing description", highlights: ["Heritage"], location: { lat: 8.3114, lng: 80.4037 }, featuredExperiences: [{ _id: "507f1f77bcf86cd799439011", title: "Walk", description: "Existing experience", image: { publicId: "destinations/walk", url: "https://res.cloudinary.com/demo/image/upload/walk.jpg", alt: "Trail" }, detailUrl: "/excursions/walk" }] };
    const result = fromFormValues(fields, toFormValues(fields, data));
    // Legacy experiences have no `verified` flag; the form fills in the model default (true).
    const expected = { ...data, featuredExperiences: data.featuredExperiences.map((e) => ({ ...e, verified: true })) };
    for (const key of Object.keys(data)) expect(result[key]).toEqual(expected[key as keyof typeof data]);
  });
  it("clears unknown coordinates without converting empty inputs to zero", () => {
    const result = fromFormValues(fields, toFormValues(fields, { name: "Destination", slug: "destination" }));
    expect(result.location).toEqual({ lat: null, lng: null });
    expect(result.featuredExperiences).toEqual([]);
  });
});
