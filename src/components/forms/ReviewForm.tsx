"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { Loader2, Star } from "lucide-react";
import { clean, reviewSchema, type ReviewValues } from "@/validations/public";
import { submitPublic } from "@/lib/api/public-client";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { Field, Honeypot, Input, SuccessPanel, Textarea, applyServerErrors } from "./fields";
import { useValidationMessages } from "./useValidationMessages";

/** Guest review submission – reviews are held as "pending" until approved in the admin. */
export function ReviewForm() {
  const t = useTranslations("reviews");
  const tb = useTranslations("booking");
  const tc = useTranslations("common");
  const messages = useValidationMessages();
  const schema = useMemo(() => reviewSchema(messages), [messages]);
  const [sent, setSent] = useState(false);
  const [failure, setFailure] = useState(false);
  const {
    register,
    handleSubmit,
    setValue,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ReviewValues>({ resolver: zodResolver(schema), defaultValues: { rating: 0, guestName: "", email: "", review: "" } });
  const rating = useWatch({ control, name: "rating" });

  const onSubmit = handleSubmit(async (values) => {
    setFailure(false);
    const res = await submitPublic("/reviews", clean(values));
    if (res.ok) setSent(true);
    else {
      applyServerErrors(res.errors, setError as never);
      setFailure(!res.errors.length);
    }
  });

  if (sent) return <SuccessPanel title={tb("successTitle")} text={t("success")} />;

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-5 rounded-3xl bg-white p-6 shadow-card sm:grid-cols-2 sm:p-10">
      <h2 className="text-2xl text-forest-900 sm:col-span-2">{t("writeReview")}</h2>
      <Honeypot register={register as never} />
      <fieldset className="sm:col-span-2">
        <legend className="mb-2 text-sm font-medium text-forest-900">
          {t("rating")} <span className="text-red-600">*</span>
        </legend>
        <div className="flex gap-1" role="radiogroup">
          {[1, 2, 3, 4, 5].map((n) => (
            <button
              key={n}
              type="button"
              role="radio"
              aria-checked={rating === n}
              aria-label={`${n} / 5`}
              onClick={() => setValue("rating", n, { shouldValidate: true })}
              className="rounded p-1"
            >
              <Star className={cn("h-8 w-8 transition-colors", n <= (rating ?? 0) ? "fill-gold-500 text-gold-500" : "text-sand-200 hover:text-gold-400")} />
            </button>
          ))}
        </div>
        {errors.rating && <p className="mt-1 text-xs text-red-600">{errors.rating.message}</p>}
      </fieldset>
      <Field label={tb("name")} htmlFor="rName" required error={errors.guestName?.message}>
        <Input id="rName" {...register("guestName")} />
      </Field>
      <Field label={tb("email")} htmlFor="rEmail" required error={errors.email?.message}>
        <Input id="rEmail" type="email" {...register("email")} />
      </Field>
      <Field label={tb("country")} htmlFor="rCountry">
        <Input id="rCountry" {...register("country")} />
      </Field>
      <Field label={t("title")} htmlFor="rTitle">
        <Input id="rTitle" {...register("title")} />
      </Field>
      <Field label={t("yourReview")} htmlFor="rReview" required error={errors.review?.message} className="sm:col-span-2">
        <Textarea id="rReview" {...register("review")} />
      </Field>
      {failure && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          {tb("errorGeneric")}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg")}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? tc("sending") : t("submit")}
        </button>
      </div>
    </form>
  );
}
