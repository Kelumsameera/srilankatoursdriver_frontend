import { describe, expect, it } from "vitest";
import { destinationMarker, projectCoordinates, unprojectPoint } from "@/lib/destination-map";

describe("admin location picker projection", () => {
  it("round-trips a clicked point to the same public pin position", () => {
    for (const [lat, lng] of [[7.2906, 80.6337], [9.6615, 80.0255], [6.0329, 80.2168], [6.372, 81.52]]) {
      const p = projectCoordinates(lat, lng);
      const back = unprojectPoint(p.x, p.y);
      expect(back.lat).toBeCloseTo(lat, 3);
      expect(back.lng).toBeCloseTo(lng, 3);
    }
  });
  it("keeps every accepted coordinate inside the viewBox and rejects the rest", () => {
    for (const [lat, lng] of [[5.5, 79], [10, 82.5], [9.95, 82.05], [5.5, 82.5]]) {
      const m = destinationMarker({ lat, lng })!;
      expect(m.x).toBeGreaterThanOrEqual(24);
      expect(m.x).toBeLessThanOrEqual(376);
      expect(m.y).toBeGreaterThanOrEqual(24);
      expect(m.y).toBeLessThanOrEqual(576);
    }
    expect(destinationMarker({ lat: 80.6, lng: 7.3 })).toBeNull(); // swapped
    expect(destinationMarker({ lat: 7.3, lng: null })).toBeNull(); // half-filled
  });
});
