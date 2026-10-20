"use client";

import { useId, useState } from "react";
import { RotateCcw } from "lucide-react";
import { FieldError, Input, Label } from "@/components/admin/ui";
import { cn } from "@/lib/utils";

const HEX = /^#[0-9a-f]{6}$/i;

/** Colour picker + hex text box with inline validation and a "reset to default" button. */
export function ColorField({
  label,
  hint,
  value,
  defaultValue,
  onChange,
  disabled,
}: {
  label: string;
  hint?: string;
  value: string;
  defaultValue?: string;
  onChange: (v: string) => void;
  disabled?: boolean;
}) {
  const id = useId();
  // What the admin is typing; only a valid hex colour reaches the theme.
  const [text, setText] = useState<{ for: string; value: string } | null>(null);
  const shown = text && text.for === value ? text.value : value;
  const invalid = !HEX.test(shown);

  return (
    <div>
      <Label htmlFor={id} hint={hint}>
        {label}
      </Label>
      <div className="flex items-center gap-2">
        <input
          type="color"
          value={HEX.test(value) ? value : "#000000"}
          onChange={(e) => onChange(e.target.value)}
          disabled={disabled}
          aria-label={`${label} colour picker`}
          className="h-10 w-12 shrink-0 cursor-pointer rounded-lg border border-slate-300 bg-white p-1 disabled:cursor-not-allowed"
        />
        <Input
          id={id}
          value={shown}
          disabled={disabled}
          maxLength={7}
          spellCheck={false}
          aria-invalid={invalid}
          className="font-mono uppercase"
          onChange={(e) => {
            const v = e.target.value.trim();
            setText({ for: value, value: v });
            if (HEX.test(v)) onChange(v.toLowerCase());
          }}
        />
        {defaultValue && (
          <button
            type="button"
            onClick={() => onChange(defaultValue)}
            disabled={disabled || value === defaultValue}
            title={`Reset to ${defaultValue}`}
            aria-label={`Reset ${label} to default`}
            className="rounded-lg p-2 text-slate-500 hover:bg-slate-100 hover:text-slate-800 disabled:opacity-30"
          >
            <RotateCcw className="h-4 w-4" />
          </button>
        )}
      </div>
      {invalid && <FieldError message="Use a hex colour like #0f3d2e" />}
    </div>
  );
}

/** Slider with the current value shown next to the label. */
export function RangeField({
  label,
  value,
  min,
  max,
  step,
  format = (v) => String(v),
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step: number;
  format?: (v: number) => string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <div className="flex items-baseline justify-between">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs font-medium tabular-nums text-slate-600">{format(value)}</span>
      </div>
      <input id={id} type="range" min={min} max={max} step={step} value={value} disabled={disabled} onChange={(e) => onChange(Number(e.target.value))} className="w-full accent-forest-700" />
    </div>
  );
}

/** Number input that keeps the value inside min…max. */
export function NumberField({
  label,
  value,
  min,
  max,
  step = 1,
  suffix,
  onChange,
  disabled,
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  step?: number;
  suffix?: string;
  onChange: (v: number) => void;
  disabled?: boolean;
}) {
  const id = useId();
  return (
    <div>
      <Label htmlFor={id} hint={suffix}>
        {label}
      </Label>
      <Input
        id={id}
        type="number"
        min={min}
        max={max}
        step={step}
        value={value}
        disabled={disabled}
        onChange={(e) => {
          const n = Number(e.target.value);
          if (e.target.value !== "" && Number.isFinite(n)) onChange(Math.min(max, Math.max(min, n)));
        }}
      />
    </div>
  );
}

/** A row of mutually exclusive buttons (radio group). */
export function Segmented<T extends string>({ label, value, options, onChange, disabled }: { label: string; value: T; options: { value: T; label: string }[]; onChange: (v: T) => void; disabled?: boolean }) {
  return (
    <div role="radiogroup" aria-label={label}>
      <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{label}</p>
      <div className="inline-flex flex-wrap gap-1 rounded-lg border border-slate-200 bg-slate-50 p-1">
        {options.map((o) => (
          <button
            key={o.value}
            type="button"
            role="radio"
            aria-checked={value === o.value}
            disabled={disabled}
            onClick={() => onChange(o.value)}
            className={cn("rounded-md px-3 py-1.5 text-sm font-medium transition-colors", value === o.value ? "bg-white text-forest-800 shadow-sm" : "text-slate-500 hover:text-slate-800")}
          >
            {o.label}
          </button>
        ))}
      </div>
    </div>
  );
}
