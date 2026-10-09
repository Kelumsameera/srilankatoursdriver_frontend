import createMiddleware from "next-intl/middleware";
import { NextResponse, type NextRequest } from "next/server";
import { routing } from "./i18n/routing";

const intl = createMiddleware(routing);

/** Must match the backend (middleware/security.ts → trustedProxyClientIp). */
const PROXY_SECRET_HEADER = "x-sltd-proxy-secret";
const PROXY_CLIENT_IP_HEADER = "x-sltd-client-ip";
const PROXY_CLIENT_COUNTRY_HEADER = "x-sltd-client-country";

/**
 * Calls to the Express API through the /api rewrite (next.config.ts) reach it from this host's addresses.
 * Passes the visitor's IP along with API_PROXY_SECRET (server-only) so the API's rate limits and login
 * throttling still apply per visitor. Vercel sets x-real-ip / x-forwarded-for itself, overwriting anything the
 * client sent, so the forwarded IP cannot be spoofed. Client-supplied copies of these headers are dropped.
 */
function forwardClientIp(request: NextRequest) {
  const headers = new Headers(request.headers);
  headers.delete(PROXY_SECRET_HEADER);
  headers.delete(PROXY_CLIENT_IP_HEADER);
  headers.delete(PROXY_CLIENT_COUNTRY_HEADER);
  const secret = process.env.API_PROXY_SECRET;
  const ip = request.headers.get("x-real-ip")?.trim() || request.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (secret && ip) {
    headers.set(PROXY_SECRET_HEADER, secret);
    headers.set(PROXY_CLIENT_IP_HEADER, ip);
    // Host geolocation (Vercel / Cloudflare) for the visitor analytics; only trusted alongside the secret.
    const country = (request.headers.get("x-vercel-ip-country") || request.headers.get("cf-ipcountry") || "").toUpperCase();
    if (/^[A-Z]{2}$/.test(country)) headers.set(PROXY_CLIENT_COUNTRY_HEADER, country);
  }
  return NextResponse.next({ request: { headers } });
}

/** Locale detection & prefixing for the public site; client-IP forwarding for proxied API calls. */
export default function proxy(request: NextRequest) {
  if (request.nextUrl.pathname.startsWith("/api/")) return forwardClientIp(request);
  return intl(request);
}

export const config = {
  matcher: [
    "/((?!api|admin|manager|staff|_next|_vercel|sitemap.xml|robots.txt|.*\\..*).*)",
    // Proxied API calls, except this app's own route handlers and the multipart upload routes: Vercel caps
    // request bodies that pass through Proxy at 4 MB, so uploads go straight to the rewrite.
    "/api/((?!currency|revalidate|admin/media/upload|admin/media/[^/]+/replace).*)",
  ],
};
