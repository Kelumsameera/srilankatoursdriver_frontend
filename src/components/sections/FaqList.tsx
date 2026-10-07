import { Plus } from "lucide-react";
import { Markdown } from "@/components/ui/Markdown";

/** Accessible accordion built on <details> – works without JavaScript. */
export function FaqList({ items }: { items: { question: string; answer: string }[] }) {
  if (!items.length) return null;
  return (
    <div className="divide-y divide-sand-200 overflow-hidden rounded-3xl border border-sand-200 bg-white">
      {items.map((f, i) => (
        <details key={`${i}-${f.question}`} className="group px-6 py-1 [&_summary::-webkit-details-marker]:hidden">
          <summary className="flex cursor-pointer list-none items-center justify-between gap-4 py-4 text-start font-medium text-forest-900">
            {f.question}
            <Plus className="h-5 w-5 shrink-0 text-gold-600 transition-transform group-open:rotate-45" aria-hidden />
          </summary>
          <Markdown content={f.answer} className="pb-5 text-sm text-muted" />
        </details>
      ))}
    </div>
  );
}
