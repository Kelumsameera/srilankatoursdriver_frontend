import { describe, expect, it } from "vitest";
import { inSeasonCategory, monthInRange, monthLabels, seasonFirst, seasonMonths } from "@/lib/season";
import type { Tour } from "@/types/cms";

// Must agree with seasonalTourCategories() in backend/src/services/public.service.ts (backend/tests/tour-season.test.ts)
describe("seasonal tours", () => {
  it("down south is in season from November to June (Sri Lanka time)", () => {
    for (const iso of ["2026-11-01T00:00:00+05:30", "2027-01-15T12:00:00Z", "2027-06-30T12:00:00Z", "2026-10-31T19:00:00Z"]) {
      expect(inSeasonCategory(new Date(iso)), iso).toBe("down-south-tours");
    }
  });

  it("east coast is in season from July to October", () => {
    for (const iso of ["2026-07-01T00:00:00+05:30", "2026-08-20T12:00:00Z", "2026-10-31T12:00:00Z"]) {
      expect(inSeasonCategory(new Date(iso)), iso).toBe("east-coast-tours");
    }
  });

  it("names the season's months for a seasonal tour only", () => {
    const tour = (slug: string) => ({ category: { slug } }) as Tour;
    expect(seasonMonths(tour("east-coast-tours"), "en")).toBe("July – October");
    expect(seasonMonths(tour("down-south-tours"), "en")).toBe("November – June");
    expect(seasonMonths(tour("day-tours"), "en")).toBeUndefined();
  });

  it("handles a season that runs over New Year", () => {
    expect([12, 1, 6].every((m) => monthInRange(m, [11, 6]))).toBe(true);
    expect([7, 10].some((m) => monthInRange(m, [11, 6]))).toBe(false);
  });

  it("labels the ruler's months with everyday names, also in Sinhala", () => {
    expect(monthLabels("en").short[6]).toBe("Jul");
    expect(monthLabels("si").short[6]).toBe("ජූලි");
    expect(monthLabels("si").narrow[0]).toBe("ජ");
  });

  it("puts the seasonal packages first in the category chips, in-season one leading", () => {
    const cats = ["beach-tours", "down-south-tours", "day-tours", "east-coast-tours"].map((slug) => ({ slug }));
    expect(seasonFirst(cats, new Date("2026-08-20T12:00:00Z")).map((c) => c.slug)).toEqual(["east-coast-tours", "down-south-tours", "beach-tours", "day-tours"]);
    expect(seasonFirst(cats, new Date("2027-01-15T12:00:00Z")).map((c) => c.slug)).toEqual(["down-south-tours", "east-coast-tours", "beach-tours", "day-tours"]);
  });
});
