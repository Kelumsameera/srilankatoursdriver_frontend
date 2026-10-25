import { describe, expect, it } from "vitest";
import { findRateTable } from "../src/lib/rate-origin";

const origins = ["Airport (CMB)", "Anuradhapura", "Arugam Bay", "Colombo", "Ella", "Galle", "Habarana (Sigiriya)", "Kandy", "Nuwara Eliya", "Tissamaharama (Yala)"].map((origin) => ({ origin }));
const find = (slug: string, title: string) => findRateTable(origins, { slug, title, location: title })?.origin;

describe("findRateTable", () => {
  it("matches an excursion to its starting point", () => {
    expect(find("colombo-airport", "Colombo Airport")).toBe("Airport (CMB)");
    expect(find("colombo", "Colombo")).toBe("Colombo");
    expect(find("sigiriya", "Sigiriya")).toBe("Habarana (Sigiriya)");
    expect(find("nuwara-eliya", "Nuwara Eliya")).toBe("Nuwara Eliya");
    expect(find("tissamaharama", "Tissamaharama (Yala)")).toBe("Tissamaharama (Yala)");
  });

  it("returns nothing when no table starts there", () => {
    expect(find("jaffna", "Jaffna")).toBeUndefined();
  });
});
