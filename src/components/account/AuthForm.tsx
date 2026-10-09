"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useCustomerAuth, type AuthResult } from "@/lib/customer/auth";
import { roleLandingPath, staffLogin } from "@/lib/admin/roles";
import { buttonClass } from "@/components/ui/Button";
import { Field, Input, useSubmitLock } from "@/components/forms/fields";
import { useValidationMessages } from "@/components/forms/useValidationMessages";
import { GOOGLE_CLIENT_ID, GoogleSignInButton } from "./GoogleSignInButton";

type Mode = "login" | "register";
type Values = { name: string; email: string; password: string };

/** Where to go after signing in: a same-site, locale-less path from `?next=`, else the account page. */
function nextPath() {
  const next = new URLSearchParams(window.location.search).get("next");
  return next && next.startsWith("/") && !next.startsWith("//") ? next : "/account";
}

export function AuthForm({ mode }: { mode: Mode }) {
  const t = useTranslations("account");
  const m = useValidationMessages();
  const router = useRouter();
  const { customer, loading, login, register, loginWithGoogle } = useCustomerAuth();
  const [failure, setFailure] = useState<string | null>(null);
  const [googleBusy, setGoogleBusy] = useState(false);
  const lock = useSubmitLock();

  const schema = useMemo(
    () =>
      z.object({
        name: mode === "register" ? z.string().trim().min(2, m.minLength(2)).max(120) : z.string(),
        email: z.string().trim().email(m.email),
        password:
          mode === "register"
            ? z.string().min(8, t("passwordRule")).max(128).regex(/[A-Za-z]/, t("passwordRule")).regex(/\d/, t("passwordRule"))
            : z.string().min(1, m.required).max(128),
      }),
    [mode, m, t],
  );
  const {
    register: field,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<Values>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", password: "" } });

  // Already signed in (or just signed in): leave the form.
  useEffect(() => {
    if (customer) router.replace(nextPath());
  }, [customer, router]);

  const explain = (res: AuthResult) => {
    if (res.status === 0) return t("errorNetwork");
    if (res.status === 409) return t("emailTaken");
    if (res.status === 423) return t("locked");
    if (res.status === 429) return t("rateLimited");
    if (res.status === 401) return t("invalidCredentials");
    if (res.status === 400) return t("checkFields");
    return t("errorGeneric");
  };

  const onSubmit = lock(
    handleSubmit(async (v) => {
      setFailure(null);
      // One sign-in page for everyone: team accounts go to their role's dashboard, everyone else is a customer.
      if (mode === "login") {
        const staff = await staffLogin(v.email, v.password);
        if (staff.status >= 200 && staff.status < 300) {
          // The admin area has its own root layout, so this is a full page load anyway.
          window.location.assign(roleLandingPath(staff.role));
          return;
        }
        if (staff.status === 0 || staff.status === 423) {
          setFailure(explain({ ok: false, status: staff.status, errors: [] }));
          return;
        }
      }
      const res = mode === "register" ? await register(v.name, v.email, v.password) : await login(v.email, v.password);
      if (res.ok) return;
      for (const e of res.errors) if (e.path === "name" || e.path === "email" || e.path === "password") setError(e.path, { message: e.message });
      if (res.status === 409) setError("email", { message: t("emailTaken") });
      setFailure(explain(res));
    }),
  );

  const onGoogle = async (credential: string) => {
    setFailure(null);
    setGoogleBusy(true);
    const res = await loginWithGoogle(credential);
    setGoogleBusy(false);
    if (!res.ok) setFailure(res.status === 409 ? t("googleConflict") : res.status === 0 ? t("errorNetwork") : t("googleFailed"));
  };

  if (loading || customer) {
    return (
      <div className="flex justify-center py-16 text-muted" role="status">
        <Loader2 className="h-6 w-6 animate-spin" aria-label={t("loading")} />
      </div>
    );
  }

  const busy = isSubmitting || googleBusy;
  const isLogin = mode === "login";
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-card sm:p-10" data-testid={`${mode}-form`}>
      <h1 className="text-center text-3xl text-forest-900">{isLogin ? t("signIn") : t("registerTitle")}</h1>
      {!isLogin && <p className="mt-2 text-center text-sm text-muted">{t("registerSubtitle")}</p>}

      <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5">
        {!isLogin && (
          <Field label={t("name")} htmlFor="accName" required error={errors.name?.message}>
            <Input id="accName" autoComplete="name" aria-invalid={!!errors.name} {...field("name")} />
          </Field>
        )}
        <Field label={t("email")} htmlFor="accEmail" required error={errors.email?.message}>
          <Input id="accEmail" type="email" autoComplete="email" aria-invalid={!!errors.email} {...field("email")} />
        </Field>
        <Field label={t("password")} htmlFor="accPassword" required error={errors.password?.message} hint={isLogin ? undefined : t("passwordRule")}>
          <Input
            id="accPassword"
            type="password"
            autoComplete={isLogin ? "current-password" : "new-password"}
            aria-invalid={!!errors.password}
            {...field("password")}
          />
        </Field>
        {failure && (
          <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {failure}
          </p>
        )}
        <button type="submit" disabled={busy} className={buttonClass("primary", "lg", "w-full")}>
          {busy && <Loader2 className="h-4 w-4 animate-spin" />}
          {isLogin ? t("signIn") : t("createAccount")}
        </button>
      </form>

      {isLogin && (
        <p className="mt-4 text-center text-sm">
          <Link href="/account/forgot-password" className="text-forest-700 hover:underline">
            {t("forgotPassword")}
          </Link>
        </p>
      )}

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-sand-200" />
            {t("or")}
            <span className="h-px flex-1 bg-sand-200" />
          </div>
          <GoogleSignInButton onCredential={onGoogle} onError={() => setFailure(t("googleFailed"))} />
        </>
      )}

      <p className="mt-8 text-center text-sm text-muted">
        {isLogin ? t("noAccount") : t("haveAccount")}
        <Link href={isLogin ? "/account/register" : "/account/login"} className="mt-1 block font-medium text-forest-700 hover:underline">
          {isLogin ? t("createAccount") : t("signIn")}
        </Link>
      </p>
      {!isLogin && <p className="mt-2 text-center text-sm text-muted">{t("guestNote")}</p>}
    </div>
  );
}
