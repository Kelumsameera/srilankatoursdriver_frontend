"use client";

import { Children, useId, useState, type ReactNode } from "react";

/** Starting-point dropdown that shows one of the server-rendered rate tables (children, same order as origins). */
export function RatesOriginPicker({ origins, label, heading, children }: { origins: string[]; label: string; heading: string; children: ReactNode }) {
  const [index, setIndex] = useState(0);
  const id = useId();
  const tables = Children.toArray(children);
  return (
    <div>
      <div className="mx-auto mb-6 max-w-sm">
        <label htmlFor={id} className="mb-1 block text-xs font-medium text-muted">
          {label}
        </label>
        <select
          id={id}
          value={index}
          onChange={(e) => setIndex(Number(e.target.value))}
          className="w-full rounded-xl border border-sand-200 bg-surface px-3 py-2.5 text-sm text-ink focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20"
        >
          {origins.map((o, i) => (
            <option key={`${o}-${i}`} value={i}>
              {o}
            </option>
          ))}
        </select>
      </div>
      <h3 className="mb-4 text-center font-display text-lg text-heading sm:text-xl" aria-live="polite">
        {heading} {origins[index]}
      </h3>
      {tables[index]}
    </div>
  );
}
