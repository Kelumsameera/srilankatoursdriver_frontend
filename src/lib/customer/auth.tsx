"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { API_URL } from "@/lib/config";

export interface Customer {
  id: string;
  name: string;
  email: string;
  avatar: string | null;
  hasPassword: boolean;
  google: boolean;
}

export interface AuthResult {
  ok: boolean;
  /** HTTP status; 0 when the API could not be reached. */
  status: number;
  errors: { path: string; message: string }[];
}

interface CustomerAuthState {
  customer: Customer | null;
  /** True until the stored session has been checked. */
  loading: boolean;
  login: (email: string, password: string) => Promise<AuthResult>;
  register: (name: string, email: string, password: string) => Promise<AuthResult>;
  loginWithGoogle: (credential: string) => Promise<AuthResult>;
  logout: () => Promise<void>;
}

/**
 * Only a hint ("this browser signed in before") – the session itself lives in httpOnly cookies on the API.
 * It lets anonymous visitors skip the session check entirely.
 */
const HINT_KEY = "sltd_customer";
const readHint = () => {
  try {
    return localStorage.getItem(HINT_KEY) === "1";
  } catch {
    return false;
  }
};
const writeHint = (on: boolean) => {
  try {
    if (on) localStorage.setItem(HINT_KEY, "1");
    else localStorage.removeItem(HINT_KEY);
  } catch {
    // storage blocked – the session still works, it is just re-checked less eagerly
  }
};

async function call(path: string, body?: unknown) {
  const res = await fetch(`${API_URL}/customer/auth${path}`, {
    method: body === undefined ? "GET" : "POST",
    credentials: "include",
    headers: { accept: "application/json", ...(body !== undefined ? { "content-type": "application/json" } : {}) },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  });
  const json = (await res.json().catch(() => null)) as { data?: { user?: Customer }; errors?: AuthResult["errors"] } | null;
  return { status: res.status, ok: res.ok, user: json?.data?.user ?? null, errors: res.status === 400 && Array.isArray(json?.errors) ? json.errors : [] };
}

const CustomerAuthContext = createContext<CustomerAuthState | null>(null);

/** Optional website accounts. Everything is enforced by the API – this only drives the UI. */
export function CustomerAuthProvider({ children }: { children: ReactNode }) {
  const [customer, setCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!readHint()) return;
      try {
        let res = await call("/me");
        // Access token expired → rotate the refresh token once.
        if (res.status === 401) res = await call("/refresh", {});
        if (cancelled) return;
        if (res.ok && res.user) setCustomer(res.user);
        else if (res.status === 401 || res.status === 403) writeHint(false);
      } catch {
        // API unreachable: keep the hint and show the signed-out UI for now.
      }
    })().finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, []);

  const signIn = useCallback(async (path: string, body: unknown): Promise<AuthResult> => {
    try {
      const res = await call(path, body);
      if (res.ok && res.user) {
        setCustomer(res.user);
        writeHint(true);
      }
      return { ok: res.ok, status: res.status, errors: res.errors };
    } catch {
      return { ok: false, status: 0, errors: [] };
    }
  }, []);

  const login = useCallback((email: string, password: string) => signIn("/login", { email, password }), [signIn]);
  const register = useCallback((name: string, email: string, password: string) => signIn("/register", { name, email, password }), [signIn]);
  const loginWithGoogle = useCallback((credential: string) => signIn("/google", { credential }), [signIn]);
  const logout = useCallback(async () => {
    await call("/logout", {}).catch(() => undefined);
    writeHint(false);
    setCustomer(null);
  }, []);

  const value = useMemo(() => ({ customer, loading, login, register, loginWithGoogle, logout }), [customer, loading, login, register, loginWithGoogle, logout]);
  return <CustomerAuthContext.Provider value={value}>{children}</CustomerAuthContext.Provider>;
}

export function useCustomerAuth() {
  const ctx = useContext(CustomerAuthContext);
  if (!ctx) throw new Error("useCustomerAuth must be used inside CustomerAuthProvider");
  return ctx;
}
