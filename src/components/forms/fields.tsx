"use client";

import { forwardRef, useCallback, useRef, type InputHTMLAttributes, type ReactNode, type SelectHTMLAttributes, type TextareaHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

const control =
  "w-full rounded-xl border border-sand-200 bg-white px-4 py-3 text-[0.95rem] text-ink placeholder:text-muted/70 transition-colors focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/20 aria-[invalid=true]:border-red-500";

export function Field({ label, error, children, hint, required, htmlFor, className }: { label: string; error?: string; children: ReactNode; hint?: string; required?: boolean; htmlFor: string; className?: string }) {
  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={htmlFor} className="text-sm font-medium text-forest-900">
        {label}
        {required && <span className="text-red-600"> *</span>}
      </label>
      {children}
      {hint && !error && <p className="text-xs text-muted">{hint}</p>}
      {error && (
        <p className="text-xs text-red-600" role="alert" id={`${htmlFor}-error`}>
          {error}
        </p>
      )}
    </div>
  );
}

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...props }, ref) {
  return <input ref={ref} className={cn(control, className)} {...props} />;
});

export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...props }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-32 resize-y", className)} {...props} />;
});

export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, children, ...props }, ref) {
  return (
    <select ref={ref} className={cn(control, "appearance-none bg-[url('data:image/svg+xml;utf8,<svg xmlns=%22http://www.w3.org/2000/svg%22 viewBox=%220 0 20 20%22 fill=%22%235d6b63%22><path d=%22M5 7l5 5 5-5z%22/></svg>')] bg-[length:1.25rem] bg-[right_0.75rem_center] bg-no-repeat pe-10 rtl:bg-[left_0.75rem_center]", className)} {...props}>
      {children}
    </select>
  );
});

/** Invisible honeypot field – bots fill it, humans never see it. */
export function Honeypot({ register }: { register: (name: "website") => object }) {
  return (
    <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
      <label>
        Website
        <input type="text" tabIndex={-1} autoComplete="off" {...register("website")} />
      </label>
    </div>
  );
}

export function SuccessPanel({ title, text, extra }: { title: string; text: string; extra?: ReactNode }) {
  return (
    <div role="status" className="rounded-3xl bg-forest-800 p-10 text-center text-white">
      <span className="mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full bg-gold-500 text-3xl text-forest-950">✓</span>
      <h2 className="text-3xl">{title}</h2>
      <p className="mt-3 text-white/80">{text}</p>
      {extra && <div className="mt-4 font-mono text-gold-400">{extra}</div>}
    </div>
  );
}

/** Maps API field errors (e.g. "customer.email") onto react-hook-form fields. */
export function applyServerErrors(errors: { path: string; message: string }[], setError: (name: never, e: { message: string }) => void) {
  for (const e of errors) if (e.path) setError(e.path as never, { message: e.message });
}

/**
 * Translation key (in the "booking" namespace) for a failed public submission. Every failure shows a
 * message – raw API text is never displayed, and field errors also get a summary in case the
 * offending field is not visible on the current step.
 */
export function failureKey(res: { status: number; errors: unknown[] }): "errorFields" | "errorRateLimited" | "errorNetwork" | "errorGeneric" {
  if (res.errors.length) return "errorFields";
  if (res.status === 429) return "errorRateLimited";
  if (res.status === 0) return "errorNetwork";
  return "errorGeneric";
}

/** Guards a submit handler against re-entry (double click / repeated Enter before the button disables). */
export function useSubmitLock() {
  const busy = useRef(false);
  return useCallback(<A extends unknown[]>(fn: (...args: A) => Promise<void>) => async (...args: A) => {
    if (busy.current) return;
    busy.current = true;
    try {
      await fn(...args);
    } finally {
      busy.current = false;
    }
  }, []);
}
