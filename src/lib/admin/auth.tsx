"use client";

import { createContext, useCallback, useContext, useMemo, type ReactNode } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { AdminApiError, api } from "./api";

export interface AdminUser {
  id: string;
  name: string;
  email: string;
  role: { id: string; name: string } | null;
  permissions: string[];
  lastLoginAt?: string;
}

interface AuthState {
  user: AdminUser | null;
  loading: boolean;
  /** Set when the session could not be checked (API down / network) – distinct from "signed out". */
  error: unknown;
  can: (permission: string) => boolean;
  login: (email: string, password: string) => Promise<AdminUser>;
  logout: () => Promise<void>;
  reload: () => Promise<void>;
}

const AuthContext = createContext<AuthState | null>(null);

/**
 * UI-level permission awareness only (hides menus/buttons). The Express API enforces
 * every permission on the server – the frontend is never trusted.
 */
export function AuthProvider({ children }: { children: ReactNode }) {
  const qc = useQueryClient();
  const me = useQuery({
    queryKey: ["me"],
    queryFn: async () => {
      try {
        return (await api.get<{ user: AdminUser }>("/auth/me")).data.user;
      } catch (err) {
        if (err instanceof AdminApiError && (err.status === 401 || err.status === 403)) return null;
        throw err;
      }
    },
    retry: false,
    staleTime: 5 * 60_000,
  });
  const user = me.data ?? null;
  const loading = me.isLoading;
  const error = me.isError && !me.data ? me.error : null;

  const reload = useCallback(async () => {
    await qc.invalidateQueries({ queryKey: ["me"] });
  }, [qc]);

  const login = useCallback(
    async (email: string, password: string) => {
      const res = await api.post<{ user: AdminUser }>("/auth/login", { email, password });
      qc.setQueryData(["me"], res.data.user);
      return res.data.user;
    },
    [qc],
  );

  const logout = useCallback(async () => {
    await api.post("/auth/logout").catch(() => undefined);
    qc.setQueryData(["me"], null);
    qc.removeQueries({ predicate: (q) => q.queryKey[0] !== "me" });
  }, [qc]);

  const can = useCallback(
    (permission: string) => {
      if (!user) return false;
      const p = user.permissions;
      return p.includes("*") || p.includes(permission) || p.includes(`${permission.split(":")[0]}:*`);
    },
    [user],
  );

  const value = useMemo(() => ({ user, loading, error, can, login, logout, reload }), [user, loading, error, can, login, logout, reload]);
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
