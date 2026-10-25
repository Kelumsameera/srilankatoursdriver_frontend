import type { Destination, MediaAsset, Tour } from "@/types/cms";
import { generatedDestinationImages } from "@/lib/generated-destination-images";

/** Generated CMS covers retain their disclosure in alt text even when hosted on Cloudinary. */
export function isIllustrative(url?: string, alt?: string): boolean {
  return Boolean(url?.startsWith("/images/editorial/") || /^AI-generated illustrative\b/i.test(alt ?? ""));
}

/** AI-generated illustrative media. CMS uploads always take precedence over these local fallbacks. */
export const editorialImages = {
  hero: {
    url: "/images/editorial/hero-sri-lanka-landscape.webp",
    alt: "AI-generated illustrative view of Sri Lanka's misty hill country and a winding road",
    resourceType: "image",
    width: 1672,
    height: 941,
  },
  sigiriya: {
    url: "/images/editorial/destination-sigiriya.webp",
    alt: "AI-generated illustrative view of Sigiriya Lion Rock above the surrounding gardens",
    resourceType: "image",
    width: 1536,
    height: 1024,
  },
  ella: {
    url: "/images/editorial/destination-ella-nine-arch-bridge.webp",
    alt: "AI-generated illustrative view of the Nine Arch Bridge in Ella's green hill country",
    resourceType: "image",
    width: 1536,
    height: 1024,
  },
  kandy: {
    url: "/images/editorial/destination-kandy.webp",
    alt: "AI-generated illustrative view of Kandy Lake and the Temple of the Sacred Tooth Relic",
    resourceType: "image",
    width: 1536,
    height: 1024,
  },
  mirissa: {
    url: "/images/editorial/destination-mirissa.webp",
    alt: "AI-generated illustrative view of the tropical coastline at Mirissa",
    resourceType: "image",
    width: 1536,
    height: 1024,
  },
  yala: {
    url: "/images/editorial/destination-yala-elephant.webp",
    alt: "AI-generated illustrative view of a Sri Lankan elephant beside a Yala lagoon",
    resourceType: "image",
    width: 1536,
    height: 1024,
  },
  road: {
    url: "/images/editorial/private-driver-scenic-road.webp",
    alt: "AI-generated illustrative view of a winding road through Sri Lanka's hill country",
    resourceType: "image",
    width: 1536,
    height: 1024,
  },
  vehicle: {
    url: "/images/editorial/vehicle-private-transfer-illustrative.webp",
    alt: "AI-generated illustrative private transfer van on a scenic Sri Lankan road; not a fleet vehicle",
    resourceType: "image",
    width: 1672,
    height: 941,
  },
} satisfies Record<string, MediaAsset>;

export function travelImageFor(value: string) {
  const text = value.toLowerCase();
  if (/sigiriya|lion.?rock|dambulla/.test(text)) return editorialImages.sigiriya;
  if (/ella|nine.?arch|demodara|hill.?country|nuwara.?eliya/.test(text)) return editorialImages.ella;
  if (/kandy|tooth|peradeniya/.test(text)) return editorialImages.kandy;
  if (/mirissa|matara|weligama|unawatuna|galle|south.?coast/.test(text)) return editorialImages.mirissa;
  if (/yala|wildlife|safari|elephant/.test(text)) return editorialImages.yala;
  return editorialImages.hero;
}

/** Illustrative art that depicts exactly this destination. */
const DESTINATION_ART: Record<string, MediaAsset> = {
  ...generatedDestinationImages,
  sigiriya: editorialImages.sigiriya,
  ella: editorialImages.ella,
  kandy: editorialImages.kandy,
  mirissa: editorialImages.mirissa,
  yala: editorialImages.yala,
};

/**
 * Fallback for a destination without an uploaded image: only art that shows that very place, otherwise null
 * so the caller renders the neutral named placeholder. A destination never borrows another place's picture.
 */
export function destinationImage(destination: Pick<Destination, "name" | "slug">): MediaAsset | null {
  return DESTINATION_ART[destination.slug] ?? null;
}

/** Uploaded hero image, else exact-place fallback art, else null (placeholder). */
export function destinationCover(destination: Pick<Destination, "name" | "slug" | "heroMedia">): MediaAsset | null {
  const hero = destination.heroMedia;
  return hero?.url && hero.resourceType !== "video" ? hero : destinationImage(destination);
}

export function tourImage(tour: Pick<Tour, "title" | "slug" | "startLocation" | "endLocation" | "destinations" | "itinerary">): MediaAsset {
  const route = [
    tour.title,
    tour.slug,
    tour.startLocation,
    tour.endLocation,
    ...(tour.destinations ?? []).flatMap((destination) => [destination.name, destination.slug]),
    ...(tour.itinerary ?? []).flatMap((day) => [day.title, day.location]),
  ]
    .filter(Boolean)
    .join(" ");
  return travelImageFor(route);
}
