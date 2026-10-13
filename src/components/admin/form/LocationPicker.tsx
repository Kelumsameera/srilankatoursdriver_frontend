// "use client" is needed because the admin clicks on the map (onClick) and it reads the form values.
"use client";

import type { MouseEvent } from "react";
import { useFormContext, useWatch, type FieldValues } from "react-hook-form";
import { destinationMarker, unprojectPoint } from "@/lib/destination-map";
import { SRI_LANKA_COASTLINE } from "@/lib/sri-lanka-coastline";

// "" or empty -> null, otherwise a number
function toNumber(value: unknown) {
  return value === "" || value == null ? null : Number(value);
}

// Admin map: click to set the destination's latitude / longitude.
// It uses the same map and maths as the public destination map, so the pin lands in exactly the same place.
// The Latitude / Longitude number inputs under it stay the real values.
export function LocationPicker({ path }: { path: string }) {
  const { control, setValue } = useFormContext<FieldValues>();
  const [lat, lng] = useWatch({ control, name: [`${path}.lat`, `${path}.lng`] }) as [unknown, unknown];
  const marker = destinationMarker({ lat: toNumber(lat), lng: toNumber(lng) });

  // Write both values into the form (null clears them)
  function setLocation(location: { lat: number; lng: number } | null) {
    const options = { shouldDirty: true, shouldValidate: true } as const;
    setValue(`${path}.lat`, location ? String(location.lat) : "", options);
    setValue(`${path}.lng`, location ? String(location.lng) : "", options);
  }

  // Turn the mouse position into a point inside the 400 × 600 map, then into latitude / longitude
  function onMapClick(event: MouseEvent<SVGSVGElement>) {
    const screenToSvg = event.currentTarget.getScreenCTM();
    if (!screenToSvg) return;
    const point = new DOMPoint(event.clientX, event.clientY).matrixTransform(screenToSvg.inverse());
    setLocation(unprojectPoint(point.x, point.y));
  }

  return (
    <div className="mb-4 flex flex-col items-start gap-3 sm:flex-row">
      {/* MAP */}
      <svg
        viewBox="0 0 400 600"
        className="w-48 shrink-0 cursor-crosshair rounded-lg border border-slate-200 bg-sky-50"
        onClick={onMapClick}
        aria-hidden
        data-testid="location-picker"
      >
        <image href="/maps/sri-lanka-terrain.webp" width="400" height="600" preserveAspectRatio="none" />
        <path d={SRI_LANKA_COASTLINE} fill="none" stroke="#5b6d4f" strokeWidth="1" />
        {marker && (
          <g transform={`translate(${marker.x} ${marker.y})`}>
            <circle r="16" fill="#fff" opacity=".8" />
            <circle r="9" fill="#0f3d2e" stroke="#fff" strokeWidth="3" />
          </g>
        )}
      </svg>

      {/* HELP TEXT + CLEAR BUTTON */}
      <div className="text-xs text-slate-600">
        <p>Click the map to set the pin, or type exact values below.</p>
        <p className="mt-1">{marker ? `Pin: ${toNumber(lat)}, ${toNumber(lng)}` : "No pin yet – the public map shows no marker."}</p>
        {marker && (
          <button type="button" className="mt-2 text-xs font-medium text-red-700 underline" onClick={() => setLocation(null)}>
            Clear location
          </button>
        )}
      </div>
    </div>
  );
}
