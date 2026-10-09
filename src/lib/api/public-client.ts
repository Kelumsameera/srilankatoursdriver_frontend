"use client";

import { API_URL } from "@/lib/config";
import type { ApiEnvelope } from "@/types/cms";

export interface SubmitResult<T> {
  ok: boolean;
  /** HTTP status; 0 when the request never reached the API (offline, DNS, CORS). */
  status: number;
  data?: T;
  /** API message for logging/debugging only – forms show their own translated text. */
  message: string;
  errors: { path: string; message: string }[];
}

/** POST to a public API endpoint (bookings, enquiries, contact, reviews). Never throws. */
export async function submitPublic<T = unknown>(path: string, body: unknown): Promise<SubmitResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      // Sends the customer session (if any) so a signed-in visitor's booking appears under "My bookings".
      credentials: "include",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
    // Field errors are only meaningful for validation failures (400); never surface 5xx details.
    const errors = res.status === 400 && Array.isArray(json?.errors) ? json.errors : [];
    return { ok: res.ok && !!json?.success, status: res.status, data: json?.data, message: json?.message ?? res.statusText, errors };
  } catch (err) {
    return { ok: false, status: 0, message: (err as Error).message, errors: [] };
  }
}
