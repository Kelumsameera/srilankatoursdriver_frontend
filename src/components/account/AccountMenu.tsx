"use client";

import { useEffect, useRef, useState } from "react";
import { useTranslations } from "next-intl";
import { LogOut, UserRound } from "lucide-react";
import { Link, usePathname, useRouter } from "@/i18n/navigation";
import { useCustomerAuth, type Customer } from "@/lib/customer/auth";
import { cn } from "@/lib/utils";

export function Avatar({ customer, size = "sm" }: { customer: Customer; size?: "sm" | "lg" }) {
  const box = size === "lg" ? "h-16 w-16 text-2xl" : "h-8 w-8 text-sm";
  if (customer.avatar) {
    // Google profile photo – not a Cloudinary asset, so a plain <img> (no custom loader).
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={customer.avatar} alt="" referrerPolicy="no-referrer" className={cn("shrink-0 rounded-full object-cover", box)} />;
  }
  return (
    <span aria-hidden className={cn("flex shrink-0 items-center justify-center rounded-full bg-gold-500 font-semibold uppercase text-forest-950", box)}>
      {customer.name.trim().charAt(0) || "?"}
    </span>
  );
}

/** Login path that returns the visitor to the current page afterwards. */
function useLoginHref() {
  const pathname = usePathname();
  return pathname.startsWith("/account") ? "/account/login" : `/account/login?next=${encodeURIComponent(pathname)}`;
}

/** Header "Sign in" link, or the signed-in customer's avatar menu. */
export function AccountMenu({ tone }: { tone: "light" | "dark" }) {
  const t = useTranslations("account");
  const router = useRouter();
  const loginHref = useLoginHref();
  const { customer, loading, logout } = useCustomerAuth();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const onDoc = (e: MouseEvent) => !ref.current?.contains(e.target as Node) && setOpen(false);
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && setOpen(false);
    document.addEventListener("mousedown", onDoc);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onDoc);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  const color = tone === "light" ? "text-white hover:bg-white/10" : "text-forest-900 hover:bg-forest-50";

  // Same footprint while the session is checked, so the header doesn't jump.
  if (loading) return <span className="inline-block h-9 w-9" aria-hidden />;

  if (!customer) {
    return (
      <Link href={loginHref} className={cn("flex items-center gap-1.5 rounded-full px-3 py-2 text-sm font-medium transition-colors", color)} data-testid="nav-sign-in">
        <UserRound className="h-4 w-4" aria-hidden />
        <span className="hidden md:inline">{t("signIn")}</span>
        <span className="sr-only md:hidden">{t("signIn")}</span>
      </Link>
    );
  }

  return (
    <div className="relative" ref={ref}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-haspopup="menu"
        aria-expanded={open}
        aria-label={t("myAccount")}
        data-testid="account-menu"
        className={cn("flex items-center rounded-full p-0.5 transition-colors", color)}
      >
        <Avatar customer={customer} />
      </button>
      {open && (
        <div role="menu" className="absolute end-0 top-full mt-2 w-60 rounded-2xl border border-sand-200 bg-white p-2 shadow-soft">
          <div className="px-3 py-2">
            <p className="truncate text-sm font-medium text-forest-900">{customer.name}</p>
            <p className="truncate text-xs text-muted">{customer.email}</p>
          </div>
          <div className="my-1 h-px bg-sand-100" />
          <Link href="/account" role="menuitem" onClick={() => setOpen(false)} className="flex items-center gap-2 rounded-xl px-3 py-2 text-sm text-forest-900 hover:bg-sand-100">
            <UserRound className="h-4 w-4" aria-hidden />
            {t("myAccount")}
          </Link>
          <button
            type="button"
            role="menuitem"
            onClick={async () => {
              setOpen(false);
              await logout();
              router.refresh();
            }}
            className="flex w-full items-center gap-2 rounded-xl px-3 py-2 text-start text-sm text-forest-900 hover:bg-sand-100"
          >
            <LogOut className="h-4 w-4" aria-hidden />
            {t("signOut")}
          </button>
        </div>
      )}
    </div>
  );
}

/** Account entry for the mobile menu. */
export function MobileAccountLink() {
  const t = useTranslations("account");
  const loginHref = useLoginHref();
  const { customer, loading } = useCustomerAuth();
  if (loading) return null;
  return (
    <Link href={customer ? "/account" : loginHref} className="flex items-center gap-3 py-4 text-lg text-forest-900">
      {customer ? <Avatar customer={customer} /> : <UserRound className="h-5 w-5" aria-hidden />}
      {customer ? t("myAccount") : t("signIn")}
    </Link>
  );
}
