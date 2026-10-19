import { NextResponse } from "next/server";

/** Legacy browser icon requests use the existing site fallback. */
export function GET(request: Request) {
  return NextResponse.redirect(new URL("/favicon-fallback.svg", request.url));
}
