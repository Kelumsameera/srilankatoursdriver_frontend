import { Suspense, type ReactNode } from "react";
import { AdminShell } from "@/components/admin/AdminShell";
import { LoadingBlock } from "@/components/admin/ui";

export default function PanelLayout({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <AdminShell>{children}</AdminShell>
    </Suspense>
  );
}
