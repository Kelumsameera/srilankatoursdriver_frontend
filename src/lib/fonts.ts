import localFont from "next/font/local";

// Preload the Latin faces used by navigation, body copy and the hero. Other scripts retain the
// existing Fontsource faces and system fallbacks, without downloading them on English pages.
export const travelSans = localFont({
  src: [
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-400-normal.woff2", weight: "400", style: "normal" },
    { path: "../../node_modules/@fontsource/poppins/files/poppins-latin-600-normal.woff2", weight: "600", style: "normal" },
  ],
  display: "swap",
  variable: "--font-travel-sans",
  fallback: ["Poppins", "Arial"],
});

export const travelDisplay = localFont({
  src: "../../node_modules/@fontsource/playfair-display/files/playfair-display-latin-400-normal.woff2",
  weight: "400",
  display: "swap",
  variable: "--font-travel-display",
  fallback: ["Playfair Display", "Georgia"],
});
