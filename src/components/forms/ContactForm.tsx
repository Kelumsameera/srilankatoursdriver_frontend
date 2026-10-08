"use client";

import { useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { clean, contactSchema, type ContactValues } from "@/validations/public";
import { submitPublic } from "@/lib/api/public-client";
import { buttonClass } from "@/components/ui/Button";
import { Field, Honeypot, Input, SuccessPanel, Textarea, applyServerErrors, failureKey, useSubmitLock } from "./fields";
import { useValidationMessages } from "./useValidationMessages";

export function ContactForm() {
  const t = useTranslations("contact");
  const tb = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale();
  const messages = useValidationMessages();
  const schema = useMemo(() => contactSchema(messages), [messages]);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState<string | null>(null);
  const lock = useSubmitLock();
  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ContactValues>({ resolver: zodResolver(schema), defaultValues: { name: "", email: "", message: "" } });

  const onSubmit = lock(handleSubmit(async (values) => {
    setFailure(null);
    const res = await submitPublic("/contact", clean({ ...values, locale }));
    if (res.ok) setSent(true);
    else {
      applyServerErrors(res.errors, setError as never);
      setFailure(tb(failureKey(res)));
    }
  }));

  if (sent) return <SuccessPanel title={tb("successTitle")} text={t("success")} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-5 rounded-3xl bg-white p-6 shadow-card sm:grid-cols-2 sm:p-10" data-testid="contact-form">
      <h2 className="text-2xl text-forest-900 sm:col-span-2">{t("formTitle")}</h2>
      <Honeypot register={register as never} />
      <Field label={tb("name")} htmlFor="cName" required error={errors.name?.message}>
        <Input id="cName" autoComplete="name" aria-invalid={!!errors.name} {...register("name")} />
      </Field>
      <Field label={tb("email")} htmlFor="cEmail" required error={errors.email?.message}>
        <Input id="cEmail" type="email" autoComplete="email" aria-invalid={!!errors.email} {...register("email")} />
      </Field>
      <Field label={tb("phone")} htmlFor="cPhone" error={errors.phone?.message}>
        <Input id="cPhone" type="tel" autoComplete="tel" {...register("phone")} />
      </Field>
      <Field label={t("subject")} htmlFor="cSubject">
        <Input id="cSubject" {...register("subject")} />
      </Field>
      <Field label={t("message")} htmlFor="cMessage" required error={errors.message?.message} className="sm:col-span-2">
        <Textarea id="cMessage" aria-invalid={!!errors.message} {...register("message")} />
      </Field>
      {failure && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          {failure}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg")}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? tc("sending") : tc("send")}
        </button>
      </div>
    </form>
  );
}
