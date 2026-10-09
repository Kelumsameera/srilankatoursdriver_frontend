import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

/** Headline figure for a list page (e.g. Customers). `accent` highlights one tile per row. */
export function StatTile({ icon: Icon, label, value, suffix, accent }: { icon: LucideIcon; label: string; value?: number; suffix?: string; accent?: boolean }) {
  return (
    <div className={cn("rounded-xl p-4 shadow-sm", accent ? "bg-forest-800 text-white" : "border border-slate-200 bg-white")}>
      <div className="flex items-center justify-between">
        <p className={cn("text-xs font-medium uppercase tracking-wide", accent ? "text-white/70" : "text-slate-500")}>{label}</p>
        <Icon className={cn("h-4 w-4", accent ? "text-gold-400" : "text-slate-400")} />
      </div>
      <p className={cn("mt-2 text-3xl font-semibold tabular-nums", !accent && "text-slate-900")}>
        {value ?? "—"}
        {suffix && <span className={cn("ms-2 text-sm font-medium", accent ? "text-white/70" : "text-slate-400")}>{suffix}</span>}
      </p>
    </div>
  );
}
