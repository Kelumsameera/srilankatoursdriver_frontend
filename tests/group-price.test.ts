import { describe, expect, it } from "vitest";
import { groupPriceFor, maxGroupSize, tripEndDate } from "@/lib/group-price";

const rows = [
  { persons: 1, price: 420, vehicle: "Sedan car" },
  { persons: 2, price: 450, vehicle: "Sedan car" },
  { persons: 4, price: 530, vehicle: "KDH Flatroof" },
  { persons: 10, price: 640, vehicle: "KDH Highroof" },
];

describe("booking price list", () => {
  it("picks the row for the exact group size", () => {
    expect(groupPriceFor(rows, 2)).toEqual({ persons: 2, price: 450, vehicle: "Sedan car" });
    expect(groupPriceFor(rows, 10)?.vehicle).toBe("KDH Highroof");
  });

  it("has no price for unlisted, empty or oversized groups", () => {
    expect(groupPriceFor(rows, 11)).toBeUndefined();
    expect(groupPriceFor(rows, 0)).toBeUndefined();
    expect(groupPriceFor(rows, Number.NaN)).toBeUndefined();
    expect(groupPriceFor(undefined, 2)).toBeUndefined();
    expect(maxGroupSize(rows)).toBe(10);
    expect(maxGroupSize([])).toBe(0);
  });

  it("ends a trip on its last day", () => {
    expect(tripEndDate("2026-11-01", 14)).toBe("2026-11-14");
    expect(tripEndDate("2026-12-28", 5)).toBe("2027-01-01");
    expect(tripEndDate("2026-11-01", 1)).toBe("2026-11-01");
    expect(tripEndDate("", 5)).toBe("");
    expect(tripEndDate("2026-11-01", 0)).toBe("");
  });
});
