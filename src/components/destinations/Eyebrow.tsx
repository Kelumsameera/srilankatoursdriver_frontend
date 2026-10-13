import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

// Small gold uppercase label with a dot in front, shown above the destination headings
export function DotEyebrow({ children, className, as: Tag = "p" }: { children: ReactNode; className?: string; as?: "p" | "span" }) {
  return (
    <Tag className={cn("flex items-center gap-2.5 text-xs font-semibold uppercase tracking-[0.2em] text-gold-600", className)}>
      <span className="dest-dot" aria-hidden />
      <span className="min-w-0">{children}</span>
    </Tag>
  );
}
