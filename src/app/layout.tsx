import type { ReactNode } from "react";
import "@fontsource/poppins/300.css";
import "@fontsource/poppins/400.css";
import "@fontsource/poppins/500.css";
import "@fontsource/poppins/600.css";
import "@fontsource/playfair-display/400.css";
import "@fontsource/playfair-display/500.css";
import "@fontsource/playfair-display/600.css";
import "@fontsource/playfair-display/400-italic.css";
import "./globals.css";

/**
 * The root layout is a pass-through: the public site ([locale]) and the admin
 * each render their own <html> element (different lang/dir and providers).
 */
export default function RootLayout({ children }: { children: ReactNode }) {
  return children;
}
