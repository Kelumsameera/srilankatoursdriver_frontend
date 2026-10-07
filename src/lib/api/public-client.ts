"use client";

import { API_URL } from "@/lib/config";
import type { ApiEnvelope } from "@/types/cms";

export interface SubmitResult<T> {
  ok: boolean;
  data?: T;
  message: string;
  errors: { path: string; message: string }[];
}

/** POST to a public API endpoint (bookings, enquiries, contact, reviews). Never throws. */
export async function submitPublic<T = unknown>(path: string, body: unknown): Promise<SubmitResult<T>> {
  try {
    const res = await fetch(`${API_URL}${path}`, {
      method: "POST",
      headers: { "content-type": "application/json", accept: "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as ApiEnvelope<T> | null;
    return { ok: res.ok && !!json?.success, data: json?.data, message: json?.message ?? res.statusText, errors: json?.errors ?? [] };
  } catch (err) {
    return { ok: false, message: (err as Error).message, errors: [] };
  }
}
