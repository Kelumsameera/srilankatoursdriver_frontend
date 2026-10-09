import type { NextConfig } from "next";
import createNextIntlPlugin from "next-intl/plugin";
import { API_PROXY_ENABLED, BACKEND_API_URL, SERVER_API_URL } from "./src/lib/config";

const withNextIntl = createNextIntlPlugin("./src/i18n/request.ts");

const apiOrigin = (() => {
  try {
    return new URL(BACKEND_API_URL).origin;
  } catch {
    return "http://localhost:5000";
  }
})();

/**
 * Content-Security-Policy, in REPORT-ONLY mode for now: browsers log violations to the console but
 * block nothing. Once real traffic and the E2E suite show no violations, rename the header to
 * "Content-Security-Policy" to enforce it.
 *
 * Inline scripts are allowed ('unsafe-inline') because the alternative – per-request nonces – forces
 * every page to render dynamically, which would switch off the ISR caching this site relies on.
 * The policy still limits where scripts, frames and connections may come from.
 */
const isDev = process.env.NODE_ENV === "development";
const contentSecurityPolicy = [
  "default-src 'self'",
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://accounts.google.com/gsi/client`,
  "style-src 'self' 'unsafe-inline' https://accounts.google.com/gsi/style",
  // CMS content may reference images on any HTTPS host (Markdown, older media records).
  "img-src 'self' data: blob: https:",
  "media-src 'self' blob: https://res.cloudinary.com",
  "font-src 'self' data:",
  `connect-src 'self' ${apiOrigin} https://accounts.google.com/gsi/`,
  "frame-src https://www.youtube-nocookie.com https://www.youtube.com https://www.instagram.com https://www.tiktok.com https://www.google.com https://maps.google.com https://www.openstreetmap.org https://accounts.google.com/gsi/",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'self'",
].join("; ");

const securityHeaders = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "X-Frame-Options", value: "SAMEORIGIN" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  { key: "Content-Security-Policy-Report-Only", value: contentSecurityPolicy },
  // Browsers ignore HSTS on plain-HTTP origins such as localhost, so this only takes effect in production.
  // Add includeSubDomains once every subdomain is confirmed to serve HTTPS.
  { key: "Strict-Transport-Security", value: "max-age=31536000" },
];

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  images: {
    // All CMS images live on Cloudinary; the loader requests correctly sized, auto-format variants.
    loader: "custom",
    loaderFile: "./src/lib/cloudinary-loader.ts",
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  async headers() {
    return [
      { source: "/:path*", headers: securityHeaders },
      // Never let search engines index the admin.
      { source: "/admin/:path*", headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }] },
      // Proxied API responses can carry a signed-in user's data – never let Vercel's CDN cache them.
      ...(API_PROXY_ENABLED ? [{ source: "/api/:path*", headers: [{ key: "x-vercel-enable-rewrite-caching", value: "0" }] }] : []),
    ];
  },
  /**
   * Same-origin API proxy (see API_PROXY_ENABLED): /api/* is forwarded to the Express API, so its httpOnly
   * session cookies belong to this site. The target is read at build time and is the private
   * API_URL_INTERNAL when set. `afterFiles` keeps this app's own route handlers (/api/currency,
   * /api/revalidate) in front of the proxy; src/proxy.ts adds the visitor's IP for the API's rate limits.
   */
  async rewrites() {
    return {
      beforeFiles: [],
      afterFiles: API_PROXY_ENABLED ? [{ source: "/api/:path*", destination: `${SERVER_API_URL}/:path*` }] : [],
      fallback: [],
    };
  },
  env: { NEXT_PUBLIC_API_ORIGIN: apiOrigin },
};

export default withNextIntl(nextConfig);
