"use client";

import { useId, useRef, useState, type ReactNode } from "react";
import { ChevronDown } from "lucide-react";

export function RatesDisclosure({ children, enabled, more, less }: { children: ReactNode; enabled: boolean; more: string; less: string }) {
  const [expanded, setExpanded] = useState(false);
  const contentId = useId();
  const container = useRef<HTMLDivElement>(null);
  return (
    <div ref={container} className="scroll-mt-48">
      <div id={contentId} className={enabled && !expanded ? "[&_tbody_tr:nth-child(n+6)]:hidden" : undefined}>{children}</div>
      {enabled && (
        <div className="mt-4 text-center">
          <button type="button" aria-expanded={expanded} aria-controls={contentId}
            onClick={() => {
              if (expanded && container.current && container.current.getBoundingClientRect().top < 0) {
                container.current.scrollIntoView({ block: "start", behavior: "instant" });
              }
              setExpanded(!expanded);
            }}
            className="inline-flex min-h-11 items-center gap-2 rounded-full border border-gold-400 px-5 text-sm font-medium text-forest-800 hover:bg-sand-50 focus-visible:outline-2 focus-visible:outline-offset-4">
            {expanded ? less : more}
            <ChevronDown aria-hidden className={`h-4 w-4 ${expanded ? "rotate-180" : ""}`} />
          </button>
        </div>
      )}
    </div>
  );
}
