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
  /** Summary figures some list endpoints add (e.g. customers). */
  stats?: Record<string, number>;
}

const NETWORK_MESSAGE = "Cannot reach the server. Check your internet connection and try again.";

let refreshing: Promise<boolean> | null = null;

/**
 * Runs `fn` while holding a lock shared by every tab of this site, so tabs refresh one after another:
 * the second tab then sends the cookie the first one just received. (The API also tolerates two
 * near-simultaneous refreshes, so browsers without the Web Locks API still work.)
 */
async function withRefreshLock<T>(fn: () => Promise<T>): Promise<T> {
  // `await` is needed: the DOM typings declare request() as returning Promise<Promise<T>> here.
  if (typeof navigator !== "undefined" && navigator.locks) return await navigator.locks.request("sltd-admin-refresh", fn);
  return fn();
}

/** Rotates the refresh cookie once; concurrent 401s in this tab share the same refresh call. */
async function refreshSession(): Promise<boolean> {
  refreshing ??= withRefreshLock(() =>
    fetch(`${API_URL}/auth/refresh`, { method: "POST", credentials: "include" })
      .then((r) => r.ok)
      .catch(() => false),
  ).finally(() => setTimeout(() => (refreshing = null), 0));
  return refreshing;
}

type Method = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";

/**
 * Admin API client. Auth lives in httpOnly cookies (never localStorage); on an expired
 * access token it transparently refreshes once and retries.
 */
export async function adminRequest<T>(method: Method, path: string, body?: unknown, retry = true): Promise<ApiResult<T>> {
  const isForm = typeof FormData !== "undefined" && body instanceof FormData;
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, {
      method,
      credentials: "include",
      headers: { accept: "application/json", "x-requested-with": "sltd-admin", ...(body && !isForm ? { "content-type": "application/json" } : {}) },
      body: body === undefined ? undefined : isForm ? (body as FormData) : JSON.stringify(body),
    });
  } catch {
    throw new AdminApiError(0, NETWORK_MESSAGE, [], "NETWORK");
  }
  const authCall = ["/auth/login", "/auth/refresh", "/auth/logout"].some((p) => path.startsWith(p));
  if (res.status === 401 && retry && !authCall) {
    if (await refreshSession()) return adminRequest<T>(method, path, body, false);
    if (typeof window !== "undefined" && !path.startsWith("/auth/") && !window.location.pathname.startsWith("/admin/login")) {
      const next = encodeURIComponent(window.location.pathname + window.location.search);
      window.location.replace(`${window.location.origin}/admin/login?next=${next}`);
    }
  }
  const json = (await res.json().catch(() => null)) as
    | { success: boolean; message: string; data: T; meta?: PaginationMeta; errors?: { path: string; message: string }[]; code?: string; statusCounts?: Record<string, number>; stats?: Record<string, number> }
    | null;
  if (!res.ok || !json?.success) {
    throw new AdminApiError(res.status, json?.message ?? `Request failed (${res.status})`, json?.errors ?? [], json?.code);
  }
  return { data: json.data, meta: json.meta, message: json.message, statusCounts: json.statusCounts, stats: json.stats };
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
export async function downloadFile(path: string, filename: string, retry = true) {
  let res: Response;
  try {
    res = await fetch(`${API_URL}${path}`, { credentials: "include" });
  } catch {
    throw new AdminApiError(0, NETWORK_MESSAGE, [], "NETWORK");
  }
  if (res.status === 401 && retry && (await refreshSession())) return downloadFile(path, filename, false);
  if (!res.ok) {
    const json = (await res.json().catch(() => null)) as { message?: string } | null;
    throw new AdminApiError(res.status, json?.message ?? "Export failed");
  }
  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = Object.assign(document.createElement("a"), { href: url, download: filename });
  a.click();
  URL.revokeObjectURL(url);
}

/**
 * User-facing text for an API error. 4xx messages come from our API's curated ApiError/Zod messages;
 * 5xx, rate-limit and network failures get a fixed message so internal details are never shown.
 */
export function errorMessage(err: unknown): string {
  if (err instanceof AdminApiError) {
    switch (true) {
      case err.status === 0:
        return NETWORK_MESSAGE;
      case err.status === 401:
        return err.message && err.message !== "Request failed (401)" ? err.message : "Your session has expired. Please sign in again.";
      case err.status === 403:
        return err.message === "Origin not allowed" || !err.message ? "You do not have permission to perform this action." : err.message;
      case err.status === 404:
        return /^Route not found|^Request failed/.test(err.message) ? "The requested item could not be found. It may have been deleted." : err.message;
      case err.status === 409:
        return err.message || "This conflicts with an existing record.";
      case err.status === 413:
        return "The file or request is too large.";
      case err.status === 429:
        return "Too many requests. Please wait a moment and try again.";
      case err.status >= 500:
        return err.code === "CLOUDINARY_ERROR" ? "The media service (Cloudinary) could not process this file. Please try again." : "The server could not complete this request. Please try again shortly.";
    }
    return err.errors.length ? `${err.message}: ${err.errors.map((e) => `${e.path ? `${e.path} – ` : ""}${e.message}`).join("; ")}` : err.message;
  }
  if (err instanceof TypeError) return NETWORK_MESSAGE;
  return err instanceof Error && err.message ? err.message : "Something went wrong";
}
