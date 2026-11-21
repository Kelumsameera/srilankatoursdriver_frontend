import { NextResponse } from "next/server";
import { getBranding } from "@/lib/api/server";
import { cloudinaryUrl } from "@/lib/cloudinary-loader";
import { siteIconUrl } from "@/lib/site-icon";

/** Legacy browser requests use the same current logo as page metadata. */
export async function GET(request: Request) {
  const icon = siteIconUrl(await getBranding());
  const target = icon
    ? cloudinaryUrl(icon, { width: 32, height: 32, crop: "fit", format: "png" })
    : "/favicon-fallback.svg";
  const response = NextResponse.redirect(new URL(target, request.url));
  response.headers.set("Cache-Control", "no-cache");
  return response;
}
