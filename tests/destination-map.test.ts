import { describe, expect, it } from "vitest";
import { destinationMarker, projectCoordinates, validCoordinates } from "@/lib/destination-map";

describe("destination geographic projection", () => {
  it("positions known cities in the correct direction with a calibrated point", () => {
    expect(projectCoordinates(9.95, 79.35)).toEqual({ x: 30, y: 35 });
    const anuradhapura = destinationMarker({ lat: 8.3114, lng: 80.4037 })!;
    const colombo = destinationMarker({ lat: 6.9271, lng: 79.8612 })!;
    const kandy = destinationMarker({ lat: 7.2906, lng: 80.6337 })!;
    expect(anuradhapura.x).toBeCloseTo(160.55, 1);
    expect(anuradhapura.y).toBeCloseTo(239.825, 3);
    expect(anuradhapura.y).toBeLessThan(colombo.y);
    expect(kandy.x).toBeGreaterThan(colombo.x);
  });

  it("omits markers for missing, partial, nonfinite and off-map coordinates", () => {
    for (const location of [undefined, {}, { lat: null, lng: null }, { lat: 8 }, { lat: NaN, lng: 80 }, { lat: 8, lng: Infinity }, { lat: 51.5, lng: -0.1 }, { lat: 0, lng: 0 }]) {
      expect(destinationMarker(location)).toBeNull();
    }
  });

  it("accepts zero values for geographic SEO and rejects invalid global ranges", () => {
    expect(validCoordinates({ lat: 0, lng: 0 })).toBe(true);
    expect(validCoordinates({ lat: 91, lng: 80 })).toBe(false);
    expect(validCoordinates({ lat: 8, lng: -181 })).toBe(false);
  });
});
