"use client";

import {
  forwardRef,
  useEffect,
  useId,
  useRef,
  type ButtonHTMLAttributes,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

type Variant = "primary" | "secondary" | "ghost" | "danger" | "outline";
const variants: Record<Variant, string> = {
  primary: "bg-forest-800 text-white hover:bg-forest-700",
  secondary: "bg-gold-500 text-forest-950 hover:bg-gold-400",
  outline: "border border-slate-300 bg-white text-slate-700 hover:bg-slate-50",
  ghost: "text-slate-600 hover:bg-slate-100",
  danger: "bg-red-600 text-white hover:bg-red-700",
};

export const Button = forwardRef<HTMLButtonElement, ButtonHTMLAttributes<HTMLButtonElement> & { variant?: Variant; loading?: boolean; size?: "sm" | "md" }>(
  function Button({ variant = "primary", loading, size = "md", className, children, disabled, type = "button", ...props }, ref) {
    return (
      <button
        ref={ref}
        type={type}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors disabled:cursor-not-allowed disabled:opacity-50",
          size === "sm" ? "px-2.5 py-1.5 text-xs" : "px-4 py-2 text-sm",
          variants[variant],
          className,
        )}
        {...props}
      >
        {loading && <Loader2 className="h-4 w-4 animate-spin" />}
        {children}
      </button>
    );
  },
);

const control =
  "w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-900 placeholder:text-slate-400 focus:border-forest-600 focus:outline-none focus:ring-2 focus:ring-forest-600/15 disabled:bg-slate-50 aria-[invalid=true]:border-red-500";

export const Input = forwardRef<HTMLInputElement, InputHTMLAttributes<HTMLInputElement>>(function Input({ className, ...p }, ref) {
  return <input ref={ref} className={cn(control, className)} {...p} />;
});
export const Textarea = forwardRef<HTMLTextAreaElement, TextareaHTMLAttributes<HTMLTextAreaElement>>(function Textarea({ className, ...p }, ref) {
  return <textarea ref={ref} className={cn(control, "min-h-24", className)} {...p} />;
});
export const Select = forwardRef<HTMLSelectElement, SelectHTMLAttributes<HTMLSelectElement>>(function Select({ className, ...p }, ref) {
  return <select ref={ref} className={cn(control, "pe-8", className)} {...p} />;
});

export function Label({ children, htmlFor, required, hint }: { children: ReactNode; htmlFor?: string; required?: boolean; hint?: string }) {
  return (
    <label htmlFor={htmlFor} className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-600">
      {children}
      {required && <span className="text-red-600"> *</span>}
      {hint && <span className="ms-2 font-normal normal-case tracking-normal text-slate-400">{hint}</span>}
    </label>
  );
}

export function FieldError({ message }: { message?: string }) {
  return message ? <p className="mt-1 text-xs text-red-600">{message}</p> : null;
}

export function Switch({ checked, onChange, label, disabled, id }: { checked: boolean; onChange: (v: boolean) => void; label?: string; disabled?: boolean; id?: string }) {
  return (
    <label className={cn("inline-flex cursor-pointer items-center gap-2 text-sm", disabled && "cursor-not-allowed opacity-50")}>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onChange(!checked)}
        className={cn("relative h-5 w-9 shrink-0 rounded-full transition-colors", checked ? "bg-forest-600" : "bg-slate-300")}
      >
        <span className={cn("absolute top-0.5 h-4 w-4 rounded-full bg-white shadow transition-all", checked ? "start-[18px]" : "start-0.5")} />
      </button>
      {label && <span className="text-slate-700">{label}</span>}
    </label>
  );
}

export function Card({ children, className, title, actions }: { children: ReactNode; className?: string; title?: ReactNode; actions?: ReactNode }) {
  return (
    <section className={cn("rounded-xl border border-slate-200 bg-white shadow-sm", className)}>
      {(title || actions) && (
        <header className="flex items-center justify-between gap-3 border-b border-slate-100 px-5 py-3.5">
          <h2 className="font-sans text-sm font-semibold tracking-normal text-slate-800">{title}</h2>
          {actions}
        </header>
      )}
      <div className="p-5">{children}</div>
    </section>
  );
}

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h1 className="font-sans text-2xl font-semibold tracking-tight text-slate-900">{title}</h1>
        {description && <p className="mt-1 text-sm text-slate-500">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2">{actions}</div>}
    </div>
  );
}

const badgeTones: Record<string, string> = {
  green: "bg-emerald-50 text-emerald-700 ring-emerald-600/20",
  gray: "bg-slate-100 text-slate-600 ring-slate-500/20",
  amber: "bg-amber-50 text-amber-700 ring-amber-600/20",
  red: "bg-red-50 text-red-700 ring-red-600/20",
  blue: "bg-sky-50 text-sky-700 ring-sky-600/20",
  violet: "bg-violet-50 text-violet-700 ring-violet-600/20",
};

export function StatusBadge({ status }: { status?: string | boolean }) {
  const s = typeof status === "boolean" ? (status ? "enabled" : "disabled") : (status ?? "");
  const tone =
    ["published", "enabled", "active", "confirmed", "completed", "replied", "up_to_date"].includes(s)
      ? "green"
      : ["draft", "disabled", "archived", "closed", "read"].includes(s)
        ? "gray"
        : ["pending", "scheduled", "quoted", "processing", "contacted", "outdated"].includes(s)
          ? "amber"
          : ["cancelled", "rejected", "suspended", "missing"].includes(s)
            ? "red"
            : s === "new"
              ? "blue"
              : "violet";
  return <span className={cn("inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium capitalize ring-1 ring-inset", badgeTones[tone])}>{s.replace(/_/g, " ")}</span>;
}

export function Spinner({ className }: { className?: string }) {
  return <Loader2 className={cn("h-5 w-5 animate-spin text-forest-600", className)} />;
}

export function LoadingBlock() {
  return (
    <div className="flex items-center justify-center p-16">
      <Spinner />
    </div>
  );
}

export function ErrorBlock({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="rounded-xl border border-red-200 bg-red-50 p-6 text-sm text-red-700">
      <p>{message}</p>
      {onRetry && (
        <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>
          Retry
        </Button>
      )}
    </div>
  );
}

export function Empty({ children }: { children: ReactNode }) {
  return <div className="rounded-xl border border-dashed border-slate-300 p-10 text-center text-sm text-slate-500">{children}</div>;
}

/** Open dialogs, innermost last – only the top one reacts to Escape / traps focus (modals nest, e.g. media picker → details). */
const modalStack: symbol[] = [];
const FOCUSABLE = 'a[href], button:not([disabled]), input:not([disabled]):not([type="hidden"]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])';

export function Modal({ open, onClose, title, children, wide, footer }: { open: boolean; onClose: () => void; title: string; children: ReactNode; wide?: boolean; footer?: ReactNode }) {
  const dialog = useRef<HTMLDivElement>(null);
  const titleId = useId();
  const close = useRef(onClose);
  useEffect(() => {
    close.current = onClose;
  }, [onClose]);

  useEffect(() => {
    if (!open) return;
    const me = Symbol("modal");
    modalStack.push(me);
    const previous = document.activeElement as HTMLElement | null;
    // Prefer the first control in the body (or footer) over the header's close button.
    const d = dialog.current;
    const first = d?.querySelector<HTMLElement>("[autofocus]") ?? d?.querySelector<HTMLElement>(`[data-modal-body] :is(${FOCUSABLE}), footer :is(${FOCUSABLE})`);
    (first ?? d)?.focus();
    const onKey = (e: KeyboardEvent) => {
      if (modalStack[modalStack.length - 1] !== me) return;
      if (e.key === "Escape") {
        e.stopPropagation();
        close.current();
      } else if (e.key === "Tab" && dialog.current) {
        const items = Array.from(dialog.current.querySelectorAll<HTMLElement>(FOCUSABLE)).filter((el) => el.offsetParent !== null);
        if (!items.length) return;
        const [head, tail] = [items[0], items[items.length - 1]];
        if (e.shiftKey && document.activeElement === head) {
          e.preventDefault();
          tail.focus();
        } else if (!e.shiftKey && document.activeElement === tail) {
          e.preventDefault();
          head.focus();
        }
      }
    };
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("keydown", onKey);
      modalStack.splice(modalStack.indexOf(me), 1);
      if (previous?.isConnected) previous.focus();
    };
  }, [open]);

  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[60] flex items-start justify-center overflow-y-auto bg-slate-900/50 p-4 sm:p-8" onMouseDown={onClose}>
      <div
        ref={dialog}
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        tabIndex={-1}
        className={cn("w-full rounded-2xl bg-white shadow-2xl focus:outline-none", wide ? "max-w-5xl" : "max-w-lg")}
        onMouseDown={(e) => e.stopPropagation()}
      >
        <header className="flex items-center justify-between border-b border-slate-100 px-5 py-4">
          <h2 id={titleId} className="font-sans text-base font-semibold text-slate-900">
            {title}
          </h2>
          <button type="button" onClick={onClose} className="rounded-lg p-1 text-slate-500 hover:bg-slate-100" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </header>
        <div className="p-5" data-modal-body>
          {children}
        </div>
        {footer && <footer className="flex justify-end gap-2 border-t border-slate-100 px-5 py-3">{footer}</footer>}
      </div>
    </div>
  );
}

export function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Delete",
  onConfirm,
  onCancel,
  loading,
}: {
  open: boolean;
  title: string;
  message: ReactNode;
  confirmLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  loading?: boolean;
}) {
  return (
    <Modal
      open={open}
      onClose={onCancel}
      title={title}
      footer={
        <>
          <Button variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button variant="danger" onClick={onConfirm} loading={loading}>
            {confirmLabel}
          </Button>
        </>
      }
    >
      <div className="text-sm text-slate-600">{message}</div>
    </Modal>
  );
}

export function PaginationBar({ page, totalPages, total, onPage }: { page: number; totalPages: number; total: number; onPage: (p: number) => void }) {
  return (
    <div className="flex items-center justify-between border-t border-slate-100 px-4 py-3 text-sm text-slate-500">
      <span>{total} total</span>
      <div className="flex items-center gap-2">
        <Button variant="outline" size="sm" disabled={page <= 1} onClick={() => onPage(page - 1)}>
          Previous
        </Button>
        <span>
          {page} / {Math.max(1, totalPages)}
        </span>
        <Button variant="outline" size="sm" disabled={page >= totalPages} onClick={() => onPage(page + 1)}>
          Next
        </Button>
      </div>
    </div>
  );
}

export function Tabs<T extends string>({ value, onChange, tabs }: { value: T; onChange: (v: T) => void; tabs: { value: T; label: ReactNode }[] }) {
  return (
    <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200" role="tablist">
      {tabs.map((t) => (
        <button
          key={t.value}
          type="button"
          role="tab"
          aria-selected={value === t.value}
          onClick={() => onChange(t.value)}
          className={cn(
            "-mb-px border-b-2 px-3 py-2 text-sm font-medium",
            value === t.value ? "border-forest-700 text-forest-800" : "border-transparent text-slate-500 hover:text-slate-800",
          )}
        >
          {t.label}
        </button>
      ))}
    </div>
  );
}
