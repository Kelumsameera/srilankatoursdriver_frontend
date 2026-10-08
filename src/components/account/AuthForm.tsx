"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import NextLink from "next/link";
import { Loader2 } from "lucide-react";
import { Link, useRouter } from "@/i18n/navigation";
import { useCustomerAuth, type AuthResult } from "@/lib/customer/auth";
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
  return (
    <div className="mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-card sm:p-10" data-testid={`${mode}-form`}>
      <h1 className="text-3xl text-forest-900">{mode === "login" ? t("loginTitle") : t("registerTitle")}</h1>
      <p className="mt-2 text-sm text-muted">{mode === "login" ? t("loginSubtitle") : t("registerSubtitle")}</p>

      {GOOGLE_CLIENT_ID && (
        <>
          <div className="mt-8">
            <GoogleSignInButton onCredential={onGoogle} onError={() => setFailure(t("googleFailed"))} />
          </div>
          <div className="my-6 flex items-center gap-3 text-xs uppercase tracking-wider text-muted">
            <span className="h-px flex-1 bg-sand-200" />
            {t("or")}
            <span className="h-px flex-1 bg-sand-200" />
          </div>
        </>
      )}

      <form onSubmit={onSubmit} noValidate className={GOOGLE_CLIENT_ID ? "grid gap-5" : "mt-8 grid gap-5"}>
        {mode === "register" && (
          <Field label={t("name")} htmlFor="accName" required error={errors.name?.message}>
            <Input id="accName" autoComplete="name" aria-invalid={!!errors.name} {...field("name")} />
          </Field>
        )}
        <Field label={t("email")} htmlFor="accEmail" required error={errors.email?.message}>
          <Input id="accEmail" type="email" autoComplete="email" aria-invalid={!!errors.email} {...field("email")} />
        </Field>
        <Field label={t("password")} htmlFor="accPassword" required error={errors.password?.message} hint={mode === "register" ? t("passwordRule") : undefined}>
          <Input
            id="accPassword"
            type="password"
            autoComplete={mode === "register" ? "new-password" : "current-password"}
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
          {mode === "login" ? t("signIn") : t("createAccount")}
        </button>
      </form>

      <p className="mt-6 text-center text-sm text-muted">
        {mode === "login" ? t("noAccount") : t("haveAccount")}{" "}
        <Link href={mode === "login" ? "/account/register" : "/account/login"} className="font-medium text-forest-700 hover:underline">
          {mode === "login" ? t("createAccount") : t("signIn")}
        </Link>
      </p>
      <p className="mt-2 text-center text-sm text-muted">{t("guestNote")}</p>
      {mode === "login" && (
        <p className="mt-6 border-t border-sand-100 pt-4 text-center text-xs">
          <NextLink href="/admin/login" className="text-muted hover:text-forest-700 hover:underline">
            {t("staffLogin")}
          </NextLink>
        </p>
      )}
    </div>
  );
}
