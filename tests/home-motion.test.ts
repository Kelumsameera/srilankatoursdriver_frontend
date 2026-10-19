import { describe, expect, it } from "vitest";
import { parallaxOffset, pointerTilt } from "@/lib/home-motion";

describe("homepage depth motion bounds", () => {
  it("centers the layers and moves opposite strengths in opposite directions", () => {
    expect(parallaxOffset(200, 400, 800, 40)).toBe(0);
    expect(parallaxOffset(0, 400, 800, 40)).toBeGreaterThan(0);
    expect(parallaxOffset(0, 400, 800, -40)).toBeLessThan(0);
  });
  it("keeps image displacement inside the 64px overscan", () => {
    expect(parallaxOffset(-10000, 400, 800, 500)).toBe(60);
    expect(parallaxOffset(10000, 400, 800, 500)).toBe(-60);
    expect(parallaxOffset(0, 400, 0, 40)).toBe(0);
    expect(parallaxOffset(0, 400, 800, NaN)).toBe(0);
  });
  it("keeps pointer tilt neutral at center and within four degrees at the edges", () => {
    const rect = { left: 100, top: 100, width: 200, height: 400 };
    expect(pointerTilt(200, 300, rect)).toEqual({ x: -0, y: 0 });
    expect(pointerTilt(900, -900, rect)).toEqual({ x: 4, y: 4 });
    expect(pointerTilt(0, 0, { ...rect, width: 0 })).toEqual({ x: 0, y: 0 });
  });
});
