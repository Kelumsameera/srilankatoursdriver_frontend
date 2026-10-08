"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Loader2, LogOut } from "lucide-react";
import { useRouter } from "@/i18n/navigation";
import { useCustomerAuth } from "@/lib/customer/auth";
import { buttonClass, ButtonLink } from "@/components/ui/Button";
import { Avatar } from "./AccountMenu";

/** Signed-in customer's overview. Booking stays open to guests; the account only saves details. */
export function AccountPanel() {
  const t = useTranslations("account");
  const tc = useTranslations("common");
  const router = useRouter();
  const { customer, loading, logout } = useCustomerAuth();
  const [leaving, setLeaving] = useState(false);

  useEffect(() => {
    if (!loading && !customer && !leaving) router.replace("/account/login?next=/account");
  }, [loading, customer, leaving, router]);

  if (loading || !customer) {
    return (
      <div className="flex justify-center py-16 text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label={t("loading")} />
      </div>
    );
  }

  const signOut = async () => {
    setLeaving(true);
    await logout();
    router.replace("/");
  };

  return (
    <div className="mx-auto w-full max-w-xl rounded-3xl bg-white p-6 shadow-card sm:p-10" data-testid="account-panel">
      <div className="flex items-center gap-4">
        <Avatar customer={customer} size="lg" />
        <div className="min-w-0">
          <h1 className="truncate text-3xl text-forest-900">{t("hello", { name: customer.name.split(" ")[0] })}</h1>
          <p className="truncate text-sm text-muted">{customer.email}</p>
        </div>
      </div>
      <p className="mt-6 text-muted">{t("accountIntro")}</p>
      {customer.google && <p className="mt-3 text-sm text-forest-700">✓ {t("googleConnected")}</p>}
      <div className="mt-8 flex flex-wrap gap-3">
        <ButtonLink href="/booking" variant="primary">
          {tc("bookNow")}
        </ButtonLink>
        <button type="button" onClick={signOut} disabled={leaving} className={buttonClass("outline")}>
          {leaving ? <Loader2 className="h-4 w-4 animate-spin" /> : <LogOut className="h-4 w-4" />}
          {t("signOut")}
        </button>
      </div>
    </div>
  );
}
