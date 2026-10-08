"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider } from "@/lib/admin/auth";
import { AdminApiError } from "@/lib/admin/api";

export function AdminProviders({ children }: { children: ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 15_000,
            refetchOnWindowFocus: false,
            // Client errors (4xx incl. 401/403/404/429) are final; network failures (status 0) and 5xx retry twice.
            retry: (count, err) => !(err instanceof AdminApiError && err.status > 0 && err.status < 500) && count < 2,
          },
        },
      }),
  );
  return (
    <QueryClientProvider client={client}>
      <AuthProvider>{children}</AuthProvider>
      <Toaster richColors position="top-right" closeButton />
    </QueryClientProvider>
  );
}
