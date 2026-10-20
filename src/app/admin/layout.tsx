import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminProviders } from "@/components/admin/AdminProviders";
import { getAdminLocale } from "@/lib/admin/locale";
import { ADMIN_THEME_SCRIPT } from "@/features/admin/theme";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon-fallback.svg" },
};

export default async function AdminRootLayout({ children }: { children: ReactNode }) {
  const locale = await getAdminLocale();
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html>/<body> before React hydrates.
    <html lang={locale} data-site="admin" suppressHydrationWarning>
      <head>
        {/* Light / dark before the first paint (choice saved by the toggle in the top bar) */}
        <script dangerouslySetInnerHTML={{ __html: ADMIN_THEME_SCRIPT }} />
      </head>
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900 antialiased" suppressHydrationWarning>
        <AdminProviders locale={locale}>{children}</AdminProviders>
      </body>
    </html>
  );
}
