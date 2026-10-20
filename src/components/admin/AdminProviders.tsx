"use client";

import { useState, type ReactNode } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { NextIntlClientProvider } from "next-intl";
import { ADMIN_MESSAGES, type AdminLocale } from "@/features/admin/i18n";
import { AuthProvider } from "@/lib/admin/auth";
import { AdminApiError } from "@/lib/admin/api";

/** Data, auth, toasts and the admin panel texts (English or Sinhala, chosen in the top bar). */
export function AdminProviders({ children, locale = "en" }: { children: ReactNode; locale?: AdminLocale }) {
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
    <NextIntlClientProvider locale={locale} messages={ADMIN_MESSAGES[locale]} timeZone="Asia/Colombo">
      <QueryClientProvider client={client}>
        <AuthProvider>{children}</AuthProvider>
        <Toaster richColors position="top-right" closeButton />
      </QueryClientProvider>
    </NextIntlClientProvider>
  );
}
