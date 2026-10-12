// Turns latitude / longitude into x / y positions on our Sri Lanka map picture (a 400 × 600 SVG).
// The coastline, the public map pin and the admin location picker all use these same functions,
// so a pin always lands in the same place. This is a simple overview map, not a navigation map.

// The edges of the map picture in degrees
export const MAP_BOUNDS = { west: 79.35, east: 82.05, south: 5.75, north: 9.95 };

/** Accepted range for destination coordinates – must match SRI_LANKA_BOUNDS in backend/src/validations/content.ts. */
export const SRI_LANKA_BOUNDS = { lat: [5.5, 10], lng: [79, 82.5] } as const;

// Keeps the whole pin (outer ring radius 22) inside the 400 × 600 picture
const MARKER_MARGIN = 24;

// 1 degree of latitude = 125 units on the map. Longitude degrees are a little narrower near Sri Lanka (7.6° N).
const UNITS_PER_DEGREE = 125;
const LONGITUDE_SCALE = Math.cos((7.6 * Math.PI) / 180);

// latitude / longitude -> { x, y } on the map
export function projectCoordinates(lat: number, lng: number) {
  return {
    x: 30 + (lng - MAP_BOUNDS.west) * UNITS_PER_DEGREE * LONGITUDE_SCALE,
    y: 35 + (MAP_BOUNDS.north - lat) * UNITS_PER_DEGREE,
  };
}

// true when both values are real numbers in the normal world range
export function validCoordinates(location?: { lat?: number | null; lng?: number | null }) {
  const lat = location?.lat;
  const lng = location?.lng;
  return typeof lat === "number" && typeof lng === "number" && Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180;
}

// Where to draw the pin, or null when the location is missing or outside Sri Lanka
export function destinationMarker(location?: { lat?: number | null; lng?: number | null }) {
  if (!validCoordinates(location)) return null;
  const { lat, lng } = location as { lat: number; lng: number };

  const insideSriLanka = lat >= SRI_LANKA_BOUNDS.lat[0] && lat <= SRI_LANKA_BOUNDS.lat[1] && lng >= SRI_LANKA_BOUNDS.lng[0] && lng <= SRI_LANKA_BOUNDS.lng[1];
  if (!insideSriLanka) return null;

  // Keep the pin away from the edges of the picture
  const point = projectCoordinates(lat, lng);
  const keepInside = (value: number, max: number) => Math.min(max - MARKER_MARGIN, Math.max(MARKER_MARGIN, value));
  return { x: keepInside(point.x, 400), y: keepInside(point.y, 600) };
}

// The opposite of projectCoordinates: a click on the map -> latitude / longitude (used by the admin location picker)
export function unprojectPoint(x: number, y: number) {
  const lng = MAP_BOUNDS.west + (x - 30) / (UNITS_PER_DEGREE * LONGITUDE_SCALE);
  const lat = MAP_BOUNDS.north - (y - 35) / UNITS_PER_DEGREE;
  // Round to 4 decimals (about 11 metres)
  return { lat: Math.round(lat * 10000) / 10000, lng: Math.round(lng * 10000) / 10000 };
}
