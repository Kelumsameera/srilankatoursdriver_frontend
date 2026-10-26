import { useId } from "react";
import { destinationMarker, projectCoordinates } from "@/lib/destination-map";
import { SRI_LANKA_COASTLINE } from "@/lib/sri-lanka-coastline";
import type { Destination } from "@/types/cms";

// Big towns drawn as small dots so visitors can see where the pin is
const TOWNS = [
  { name: "Colombo", lat: 6.9271, lng: 79.8612 },
  { name: "Kandy", lat: 7.2906, lng: 80.6337 },
  { name: "Jaffna", lat: 9.6615, lng: 80.0255 },
  { name: "Trincomalee", lat: 8.5874, lng: 81.2152 },
  { name: "Galle", lat: 6.0329, lng: 80.2168 },
  { name: "Anuradhapura", lat: 8.3114, lng: 80.4037 },
];

// Length of 50 km on this map (1° of latitude = 125 units ≈ 111.2 km)
const SCALE_50KM = (50 / 111.2) * 125;

// Sri Lanka map with a pin on the destination (or excursion).
// fade: no frame – the sea fades out to transparent a little way past the coast.
// The background picture (public/maps/sri-lanka-terrain.webp) is public-domain elevation data,
// drawn with the same projection as the pin (see lib/destination-map.ts).
export function DestinationMap({
  destination,
  label,
  unavailable,
  caption,
  fade = false,
}: {
  destination: Pick<Destination, "name" | "location">;
  label: string;
  unavailable: string;
  caption: string;
  fade?: boolean;
}) {
  // A unique id for the SVG clip-path / shadow, so two maps on one page do not clash
  const svgId = useId().replace(/:/g, "");
  const marker = destinationMarker(destination.location);

  // Town dots, without the ones the pin would cover
  const towns = TOWNS.map((town) => ({ ...town, ...projectCoordinates(town.lat, town.lng) })).filter(
    (town) => !marker || Math.hypot(town.x - marker.x, town.y - marker.y) > 45,
  );

  // Labels near the right edge go on the left side of the dot / pin so they are not cut off
  const pinLabelOnLeft = marker ? marker.x > 230 : false;

  return (
    <figure className="min-w-0">
      <svg viewBox="0 0 400 600" role="img" aria-label={label} className="mx-auto w-full max-w-[380px]" data-testid="destination-map">
        <defs>
          <clipPath id={`${svgId}-frame`}>
            <rect width="400" height="600" rx="28" />
          </clipPath>
          {/* Island + a soft, blurred band of sea around it; everything further out becomes transparent */}
          <filter id={`${svgId}-blur`} x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="14" />
          </filter>
          <mask id={`${svgId}-fade`} maskUnits="userSpaceOnUse" x="0" y="0" width="400" height="600">
            <path d={SRI_LANKA_COASTLINE} fill="#fff" stroke="#fff" strokeWidth="44" strokeLinejoin="round" filter={`url(#${svgId}-blur)`} />
            <path d={SRI_LANKA_COASTLINE} fill="#fff" />
          </mask>
          <filter id={`${svgId}-shadow`} x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="3" stdDeviation="3" floodColor="#08261a" floodOpacity=".35" />
          </filter>
        </defs>

        {/* MAP PICTURE + COASTLINE */}
        <g {...(fade ? { mask: `url(#${svgId}-fade)` } : { clipPath: `url(#${svgId}-frame)` })}>
          <image href="/maps/sri-lanka-terrain.webp" width="400" height="600" preserveAspectRatio="none" />
          <path d={SRI_LANKA_COASTLINE} fill="none" stroke="#f7f4e8" strokeWidth="1.6" strokeOpacity=".7" strokeLinejoin="round" />
          <path d={SRI_LANKA_COASTLINE} fill="none" stroke="#5b6d4f" strokeWidth=".6" strokeOpacity=".7" strokeLinejoin="round" />
        </g>

        {/* TOWN DOTS */}
        <g fontSize="11" fill="#2f3b2c" stroke="#f7f4e8" strokeWidth="3" paintOrder="stroke" strokeLinejoin="round" aria-hidden>
          {towns.map((town) => (
            <g key={town.name} transform={`translate(${town.x} ${town.y})`}>
              <circle r="2.6" fill="#2f3b2c" stroke="#f7f4e8" strokeWidth="1.2" />
              <text x={town.x > 300 ? -6 : 6} y="4" textAnchor={town.x > 300 ? "end" : "start"}>
                {town.name}
              </text>
            </g>
          ))}
        </g>

        {/* NORTH ARROW + 50 KM SCALE BAR (left out on the faded map, where they would float on the page background) */}
        {!fade && (
          <>
            {/* NORTH ARROW */}
            <g transform="translate(352 58)" fill="#20372c" aria-hidden>
              <path d="M0-20L8 8 0 3-8 8Z" fill="#f7f4e8" stroke="#20372c" strokeWidth="1.2" strokeLinejoin="round" />
              <path d="M0-20L0 3-8 8Z" />
              <text y="24" textAnchor="middle" fontSize="12" fontWeight="600">
                N
              </text>
            </g>

            {/* 50 KM SCALE BAR */}
            <g transform="translate(30 570)" fontSize="11" fill="#20372c" aria-hidden>
              <rect width={SCALE_50KM / 2} height="5" fill="#20372c" />
              <rect x={SCALE_50KM / 2} width={SCALE_50KM / 2} height="5" fill="#f7f4e8" stroke="#20372c" strokeWidth="1" />
              <text x={SCALE_50KM + 6} y="6">
                50 km
              </text>
            </g>
          </>
        )}

        {/* PIN + DESTINATION NAME (only when the destination has a location) */}
        {marker && (
          <g transform={`translate(${marker.x} ${marker.y})`} data-testid="destination-marker" role="img" aria-label={destination.name}>
            <title>{destination.name}</title>
            <circle r="19" fill="#fff" opacity=".55" />
            <circle r="22" fill="none" stroke="#89621c" strokeWidth="2" />
            <circle r="9" className="fill-forest-800" stroke="#fff" strokeWidth="3" filter={`url(#${svgId}-shadow)`} />
            <text
              x={pinLabelOnLeft ? -28 : 28}
              y="6"
              textAnchor={pinLabelOnLeft ? "end" : "start"}
              className="fill-forest-900 font-display"
              fontSize="19"
              stroke="#fff"
              strokeWidth="5"
              paintOrder="stroke"
              strokeLinejoin="round"
              aria-hidden
            >
              {destination.name}
            </text>
          </g>
        )}
      </svg>

      {/* CAPTION */}
      <figcaption className="px-4 pb-5 text-center text-sm text-muted">
        <span className="block font-medium text-brand">{marker ? destination.name : unavailable}</span>
        <span className="mt-1 block text-xs">{caption}</span>
      </figcaption>
    </figure>
  );
}
