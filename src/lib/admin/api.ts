"use client";

import { API_URL } from "@/lib/config";
import type { PaginationMeta } from "@/types/cms";

export class AdminApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly errors: { path: string; message: string }[] = [],
    readonly code?: string,
  ) {
    super(message);
  }
}

export interface ApiResult<T> {
  data: T;
  meta?: PaginationMeta;
  message: string;
  statusCounts?: Record<string, number>;
}

let refreshing: Promise<boolean> | null = null;

/** Rotates the refresh cookie once; concurrent 401s share the same refresh call. */
async function refreshSession(): Promise<boolean> {
  refreshing ??= fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
    .then((r) => r.ok)
    .catch(() => false)
    .finally(() => setTimeout(() => (refreshing = null), 0));
  return refreshing;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Admin API client. Auth lives in httpOnly cookies (never localStorage); on an expired
 * access token it transparently refreshes once and retries.
 */
export async function adminRequest<T>(method: Method, path: string, body?: unknown, retry = true): Promise<ApiResult<T>> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  const res = await fetch(`${API_URL}${path}`, {
    method,
    credentials: "include",
    headers: { accept: "application/json", "x-requested-with": "sltd-admin", ...(body && !isForm ? { "content-type": "application/json" } : {}) },
    body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
  });
  const authCall = ["/auth/login", "/auth/refresh", "/auth/logout"].some((p) => path.startsWith(p));
  if (res.status === 401 && retry && !authCall) {
    if (await refreshSession()) return adminRequest<T>(method, path, body, false);
    if (typeof window !== "undefined" && !path.startsWith("/auth/") && !window.location.pathname.startsWith("/admin/login")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`${window.location.origin}/admin/login?next=${next}`);
    }
  }
  const json = (await res.json().catch(() => null)) as
    | { success: boolean; message: string; data: T; meta?: PaginationMeta; errors?: { path: string; message: string }[]; code?: string; statusCounts?: Record<string, number> }
    | null;
  if (!res.ok || !json?.success) {
    throw new AdminApiError(res.status, json?.message ?? `Request failed (${res.status})`, json?.errors ?? [], json?.code);
  }
  return { data: json.data, meta: json.meta, message: json.message, statusCounts: json.statusCounts };
}

export const api = {
  get: <T>(path: string) => adminRequest<T>("GET", path),
  post: <T>(path: string, body?: unknown) => adminRequest<T>("POST", path, body ?? {}),
  put: <T>(path: string, body: unknown) => adminRequest<T>("PUT", path, body),
  patch: <T>(path: string, body: unknown) => adminRequest<T>("PATCH", path, body),
  del: <T>(path: string) => adminRequest<T>("DELETE", path),
};

export function qs(params: Record<string, string | number | boolean | undefined | null>) {
  const s = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) if (v !== undefined && v !== null && v !== "") s.set(k, String(v));
  const out = s.toString();
  return out ? `?${out}` : "";
}

/** Downloads a CSV export (keeps cookies, works cross-origin). */
export async function downloadFile(path: string, filename: string) {
  const res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  if (!res.ok) throw new AdminApiError(res.status, "Export failed");
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

export function errorMessage(err: unknown): string {
  if (err instanceof AdminApiError) {
    return err.errors.length ? `${err.message}: ${err.errors.map((e) => `${e.path ? `${e.path} – ` : ""}${e.message}`).join("; ")}` : err.message;
  }
  return err instanceof Error ? err.message : "Something went wrong";
}
