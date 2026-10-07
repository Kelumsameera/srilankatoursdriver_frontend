import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import type { MediaAsset } from "@/types/cms";
import { cn } from "@/lib/utils";
import { CmsImage } from "@/components/ui/CmsImage";

export function DetailSection({ title, children, id, className }: { title?: string; children: ReactNode; id?: string; className?: string }) {
  return (
    <section id={id} className={cn("scroll-mt-28 border-t border-sand-200 py-10 first:border-t-0 first:pt-0", className)}>
      {title && <h2 className="mb-6 text-2xl text-forest-900 sm:text-3xl">{title}</h2>}
      {children}
    </section>
  );
}

export function CheckList({ items, negative }: { items?: string[]; negative?: boolean }) {
  if (!items?.length) return null;
  return (
    <ul className="space-y-2.5">
      {items.map((item, i) => (
        <li key={`${i}-${item}`} className="flex items-start gap-3 text-[0.95rem]">
          {negative ? (
            <X className="mt-0.5 h-5 w-5 shrink-0 text-earth-500" aria-hidden />
          ) : (
            <Check className="mt-0.5 h-5 w-5 shrink-0 text-forest-600" aria-hidden />
          )}
          <span>{item}</span>
        </li>
      ))}
    </ul>
  );
}

export function MediaStrip({ items, label }: { items?: MediaAsset[]; label: string }) {
  const images = (items ?? []).filter((m) => m.url && m.resourceType !== "video");
  if (!images.length) return null;
  return (
    <div className="grid grid-cols-2 gap-3 sm:grid-cols-3" aria-label={label}>
      {images.slice(0, 9).map((m, i) => (
        <CmsImage
          key={`${m.publicId}-${i}`}
          media={m}
          alt={m.alt || label}
          sizes="(min-width: 640px) 33vw, 50vw"
          wrapperClassName={cn("rounded-2xl", i === 0 ? "col-span-2 row-span-2 aspect-square sm:aspect-auto" : "aspect-square")}
        />
      ))}
    </div>
  );
}

export function FactList({ facts }: { facts: { icon: ReactNode; label: string; value?: ReactNode }[] }) {
  const shown = facts.filter((f) => f.value);
  if (!shown.length) return null;
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-5 sm:grid-cols-4">
      {shown.map((f) => (
        <div key={f.label} className="flex items-start gap-3">
          <span className="mt-0.5 text-gold-500">{f.icon}</span>
          <div>
            <dt className="text-xs uppercase tracking-wider text-white/60">{f.label}</dt>
            <dd className="mt-0.5 font-medium text-white">{f.value}</dd>
          </div>
        </div>
      ))}
    </dl>
  );
}
