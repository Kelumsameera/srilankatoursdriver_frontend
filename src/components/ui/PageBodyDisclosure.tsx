"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function PageBodyDisclosure({ preview, more, less, children, light = false }: { preview: string; more: string; less: string; children: ReactNode; light?: boolean }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const container = useRef<HTMLDivElement>(null);
  return (
    <div ref={container} className="scroll-mt-28">
      {!expanded && <p className={`text-sm leading-7 sm:text-base ${light ? "text-white/85" : "text-muted"}`}>{preview}</p>}
      <div id={contentId} hidden={!expanded}>{children}</div>
      <button
        type="button"
        aria-expanded={expanded}
        aria-controls={contentId}
        onClick={() => {
          if (expanded && container.current && container.current.getBoundingClientRect().top < 0) {
            container.current.scrollIntoView({ block: "start", behavior: "instant" });
          }
          setExpanded(!expanded);
        }}
        className={`mt-2 inline-flex min-h-11 items-center gap-2 text-sm font-semibold underline decoration-gold-400 underline-offset-4 focus-visible:outline-2 focus-visible:outline-offset-4 ${light ? "text-white hover:text-gold-300" : "text-forest-800 hover:text-forest-600"}`}
      >
        {expanded ? less : more}
        <ChevronDown aria-hidden className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`} />
      </button>
    </div>
  );
}
