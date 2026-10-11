import type { MediaAsset } from "@/types/cms";
import { editorialImages } from "@/lib/editorial-images";

/**
 * Bundled banner photos for inner pages, used only while the admin hasn't uploaded a page hero image
 * (a CMS image always wins). Files live in /public/images/banners, each pre-rendered at 640, 1080 and
 * full width (see localImageUrl in cloudinary-loader.ts). Credited photos show their source credit below;
 * generated representative imagery is visibly labeled. Keep public/images/banners/CREDITS.md in sync.
 */
export interface PageBanner {
  src: string;
  alt: string;
  width: number;
  height: number;
  /** CSS object-position keeping the subject in frame on narrow (portrait) screens. */
  focus: string;
  credit?: { author: string; license: string; licenseUrl: string; source: string };
  /** Generated representative imagery, labeled visibly as illustrative in the page banner. */
  illustrative?: boolean;
}

const commons = (file: string) => `https://commons.wikimedia.org/wiki/File:${file}`;
const BY2 = { license: "CC BY 2.0", licenseUrl: "https://creativecommons.org/licenses/by/2.0/" };
const BY3 = { license: "CC BY 3.0", licenseUrl: "https://creativecommons.org/licenses/by/3.0/" };
const BY4 = { license: "CC BY 4.0", licenseUrl: "https://creativecommons.org/licenses/by/4.0/" };

const banners = {
  tours: {
    src: "/images/banners/tours-banner.webp",
    alt: "Nine Arch Bridge at Demodara, near Ella, surrounded by hill-country forest",
    width: 1752,
    height: 1168,
    focus: "62% 50%",
    credit: { author: "Tuderna", ...BY3, source: commons("Demodara_Nine_Arch_Bridge_-_panoramio.jpg") },
  },
  destinations: {
    src: "/images/banners/destinations-banner.webp",
    alt: "Sigiriya Lion Rock rising above the palace gardens",
    width: 1920,
    height: 1280,
    focus: "50% 12%",
    credit: { author: "dronepicr", ...BY2, source: commons("Sigiriya_Sri_Lanka_(30073766295).jpg") },
  },
  vehicles: {
    src: editorialImages.vehicle.url!,
    alt: editorialImages.vehicle.alt!,
    width: editorialImages.vehicle.width!,
    height: editorialImages.vehicle.height!,
    focus: "74% 52%",
    illustrative: true,
  },
  "tailor-made-tours": {
    src: "/images/banners/tailor-made-banner.webp",
    alt: "Aerial view of the Mirissa coastline on Sri Lanka's south coast",
    width: 1920,
    height: 1078,
    focus: "45% 60%",
    credit: { author: "dronepicr", ...BY2, source: commons("Mirissa_beach_aerial_(29448581263).jpg") },
  },
  excursions: {
    src: "/images/banners/excursions-banner.webp",
    alt: "Evening light at the Temple of the Tooth in Kandy",
    width: 1920,
    height: 1280,
    focus: "65% 50%",
    credit: { author: "Ernest Jourdier", ...BY4, source: commons("Temple_of_the_Tooth_Kandy.jpg") },
  },
  gallery: {
    src: "/images/banners/gallery-banner.webp",
    alt: "Wild elephant beside a lagoon in Yala National Park",
    width: 1920,
    height: 1081,
    focus: "50% 70%",
    credit: { author: "Richard Mortel", ...BY4, source: commons("An_Elephant_in_Yala_National_Park,_Sri_Lanka.jpg") },
  },
  blog: {
    src: "/images/banners/blog-banner.webp",
    alt: "Misty mountains around Ella in Sri Lanka's hill country",
    width: 1920,
    height: 1280,
    focus: "50% 55%",
    credit: { author: "Vyacheslav Argenberg", ...BY4, source: commons("Ella,_Sri_Lanka,_Mountains_in_clouds,_Panorama.jpg") },
  },
  default: {
    src: "/images/banners/default-banner.webp",
    alt: "Clouds drifting through a green valley near Ella",
    width: 1920,
    height: 1280,
    focus: "50% 50%",
    credit: { author: "Vyacheslav Argenberg", ...BY4, source: commons("Ella,_Sri_Lanka,_Valley_in_clouds.jpg") },
  },
} satisfies Record<string, PageBanner>;

export type PageBannerKey = keyof typeof banners;

export function pageBanner(key: PageBannerKey = "default"): PageBanner {
  return banners[key];
}

/** The banner as a MediaAsset, so it renders through the same CmsImage path as uploaded images. */
export function bannerMedia(banner: PageBanner): MediaAsset {
  return { url: banner.src, alt: banner.alt, resourceType: "image", width: banner.width, height: banner.height };
}
