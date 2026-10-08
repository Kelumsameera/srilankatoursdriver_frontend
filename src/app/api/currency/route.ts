import { NextResponse, type NextRequest } from "next/server";
import { CURRENCIES } from "@/lib/currency";

/**
 * Exchange rates for the floating currency converter.
 * Uses ExchangeRate-API's free, keyless endpoint (no secret to leak) and caches it for 6 hours,
 * so visitors never call the provider directly and the free quota is respected.
 */
export const revalidate = 21600;

const SUPPORTED = new Set<string>(CURRENCIES);

export async function GET(req: NextRequest) {
  const base = (req.nextUrl.searchParams.get("base") ?? "USD").toUpperCase();
  if (!SUPPORTED.has(base)) {
    return NextResponse.json({ success: false, message: "Unsupported currency" }, { status: 400 });
  }
  try {
    const res = await fetch(`https://open.er-api.com/v6/latest/${base}`, { next: { revalidate } });
    const json = (await res.json()) as { result?: string; rates?: Record<string, number>; time_last_update_unix?: number };
    if (!res.ok || json.result !== "success" || !json.rates) throw new Error(`provider responded ${res.status}`);
    const rates = Object.fromEntries(CURRENCIES.filter((c) => typeof json.rates?.[c] === "number").map((c) => [c, json.rates![c]]));
    return NextResponse.json(
      { success: true, data: { base, rates, updatedAt: json.time_last_update_unix ? new Date(json.time_last_update_unix * 1000).toISOString() : null } },
      { headers: { "cache-control": "public, max-age=3600, stale-while-revalidate=21600" } },
    );
  } catch (err) {
    console.warn("[currency]", (err as Error).message);
    return NextResponse.json({ success: false, message: "Exchange rates are unavailable" }, { status: 502 });
  }
}
