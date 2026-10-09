"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useTranslations } from "next-intl";
import { CheckCircle2, Loader2 } from "lucide-react";
import { Link } from "@/i18n/navigation";
import { API_URL } from "@/lib/config";
import { buttonClass } from "@/components/ui/Button";
import { Field, Input, useSubmitLock } from "@/components/forms/fields";
import { useValidationMessages } from "@/components/forms/useValidationMessages";

/** POSTs to the password API (team and customer accounts alike). Status 0 means the API could not be reached. */
async function post(path: string, body: unknown) {
  try {
    const res = await fetch(`${API_URL}/password${path}`, {
      method: "POST",
      credentials: "include",
      headers: { accept: "application/json", "content-type": "application/json" },
      body: JSON.stringify(body),
    });
    const json = (await res.json().catch(() => null)) as { errors?: { path: string; message: string }[] } | null;
    return { status: res.status, errors: Array.isArray(json?.errors) ? json.errors : [] };
  } catch {
    return { status: 0, errors: [] };
  }
}

const card = "mx-auto w-full max-w-md rounded-3xl bg-white p-6 shadow-card sm:p-10";

function Done({ message, link, linkLabel }: { message: string; link: string; linkLabel: string }) {
  return (
    <div className="mt-8 text-center">
      <CheckCircle2 className="mx-auto h-10 w-10 text-forest-700" />
      <p role="status" className="mt-4 text-sm text-forest-900">
        {message}
      </p>
      <Link href={link} className={buttonClass("primary", "lg", "mt-6 w-full")}>
        {linkLabel}
      </Link>
    </div>
  );
}

export function ForgotPasswordForm() {
  const t = useTranslations("account");
  const m = useValidationMessages();
  const lock = useSubmitLock();
  const [sentTo, setSentTo] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const schema = useMemo(() => z.object({ email: z.string().trim().email(m.email) }), [m]);
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<{ email: string }>({ resolver: zodResolver(schema), defaultValues: { email: "" } });

  const onSubmit = lock(
    handleSubmit(async ({ email }) => {
      setFailure(null);
      const res = await post("/forgot", { email });
      if (res.status >= 200 && res.status < 300) return setSentTo(email);
      setFailure(res.status === 0 ? t("errorNetwork") : res.status === 429 ? t("rateLimited") : t("errorGeneric"));
    }),
  );

  return (
    <div className={card} data-testid="forgot-password-form">
      <h1 className="text-center text-3xl text-forest-900">{t("forgotTitle")}</h1>
      {sentTo ? (
        <Done message={t("resetSent", { email: sentTo })} link="/account/login" linkLabel={t("backToSignIn")} />
      ) : (
        <>
          <p className="mt-2 text-center text-sm text-muted">{t("forgotSubtitle")}</p>
          <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5">
            <Field label={t("email")} htmlFor="resetEmail" required error={errors.email?.message}>
              <Input id="resetEmail" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
            </Field>
            {failure && (
              <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
                {failure}
              </p>
            )}
            <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg", "w-full")}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {t("sendResetLink")}
            </button>
          </form>
          <p className="mt-6 text-center text-sm">
            <Link href="/account/login" className="font-medium text-forest-700 hover:underline">
              {t("backToSignIn")}
            </Link>
          </p>
        </>
      )}
    </div>
  );
}

type ResetValues = { password: string; confirm: string };

export function ResetPasswordForm({ token }: { token: string }) {
  const t = useTranslations("account");
  const m = useValidationMessages();
  const lock = useSubmitLock();
  const [done, setDone] = useState(false);
  const [invalid, setInvalid] = useState(!token);
  const [failure, setFailure] = useState<string | null>(null);
  // The customer rule; team accounts have a stricter one that the API reports on the password field.
  const schema = useMemo(
    () =>
      z
        .object({
          password: z.string().min(8, t("passwordRule")).max(128).regex(/[A-Za-z]/, t("passwordRule")).regex(/\d/, t("passwordRule")),
          confirm: z.string().min(1, m.required),
        })
        .refine((v) => v.password === v.confirm, { path: ["confirm"], message: t("passwordsDontMatch") }),
    [m, t],
  );
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ResetValues>({ resolver: zodResolver(schema), defaultValues: { password: "", confirm: "" } });

  const onSubmit = lock(
    handleSubmit(async ({ password }) => {
      setFailure(null);
      const res = await post("/reset", { token, password });
      if (res.status >= 200 && res.status < 300) return setDone(true);
      if (res.errors.some((e) => e.path === "token")) return setInvalid(true);
      const passwordErrors = res.errors.filter((e) => e.path === "password");
      if (passwordErrors.length) return setError("password", { message: passwordErrors.map((e) => e.message).join(". ") });
      setFailure(res.status === 0 ? t("errorNetwork") : res.status === 429 ? t("rateLimited") : t("errorGeneric"));
    }),
  );

  return (
    <div className={card} data-testid="reset-password-form">
      <h1 className="text-center text-3xl text-forest-900">{t("resetTitle")}</h1>
      {done ? (
        <Done message={t("resetDone")} link="/account/login" linkLabel={t("signIn")} />
      ) : invalid ? (
        <>
          <p role="alert" className="mt-8 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {t("resetInvalid")}
          </p>
          <Link href="/account/forgot-password" className={buttonClass("primary", "lg", "mt-6 w-full")}>
            {t("requestNewLink")}
          </Link>
        </>
      ) : (
        <form onSubmit={onSubmit} noValidate className="mt-8 grid gap-5">
          <Field label={t("newPassword")} htmlFor="resetPassword" required error={errors.password?.message} hint={t("passwordRule")}>
            <Input id="resetPassword" type="password" autoComplete="new-password" aria-invalid={!!errors.password} {...register("password")} />
          </Field>
          <Field label={t("confirmPassword")} htmlFor="resetConfirm" required error={errors.confirm?.message}>
            <Input id="resetConfirm" type="password" autoComplete="new-password" aria-invalid={!!errors.confirm} {...register("confirm")} />
          </Field>
          {failure && (
            <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700">
              {failure}
            </p>
          )}
          <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg", "w-full")}>
            {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
            {t("updatePassword")}
          </button>
        </form>
      )}
    </div>
  );
}
