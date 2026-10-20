import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { getAdminLocale } from "@/lib/admin/locale";

export const metadata: Metadata = {
  robots: { index: false, follow: false },
  icons: { icon: "/favicon-fallback.svg" },
};

export default async function RoleLayout({ children }: { children: ReactNode }) {
  const locale = await getAdminLocale();
  return (
    <html lang={locale}>
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900 antialiased">
        <AdminProviders locale={locale}>{children}</AdminProviders>
      </body>
    </html>
  );
}
