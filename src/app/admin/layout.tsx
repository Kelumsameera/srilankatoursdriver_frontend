import type { Metadata } from "next";
import type { ReactNode } from "react";
import { AdminProviders } from "@/components/admin/AdminProviders";

export const metadata: Metadata = {
  title: { default: "Admin", template: "%s · Admin" },
  robots: { index: false, follow: false },
  icons: { icon: "/favicon-fallback.svg" },
};

export default function AdminRootLayout({ children }: { children: ReactNode }) {
  return (
    // suppressHydrationWarning: browser extensions add attributes to <html>/<body> before React hydrates.
    <html lang="en" suppressHydrationWarning>
      <body className="min-h-dvh bg-slate-50 font-sans text-slate-900 antialiased" suppressHydrationWarning>
        <AdminProviders>{children}</AdminProviders>
      </body>
    </html>
  );
}
