"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { bookingSchema, clean, type BookingValues } from "@/validations/public";
import { submitPublic } from "@/lib/api/public-client";
import { buttonClass } from "@/components/ui/Button";
import { Field, Honeypot, Input, Select, SuccessPanel, Textarea, applyServerErrors, failureKey, useSubmitLock } from "./fields";
import { useValidationMessages } from "./useValidationMessages";

interface Option {
  id: string;
  label: string;
}

interface Props {
  tours: Option[];
  excursions: Option[];
  vehicles: Option[];
  initial: { type?: string; tour?: string; excursion?: string; vehicle?: string };
}

export function BookingForm({ tours, excursions, vehicles, initial }: Props) {
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale();
  const messages = useValidationMessages();
  const schema = useMemo(() => bookingSchema(messages), [messages]);
  const [reference, setReference] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);
  const initialType = (["tour", "excursion", "vehicle"].includes(initial.type ?? "") ? initial.type : "general") as BookingValues["type"];

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<BookingValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      type: initialType,
      tour: initial.tour ?? "",
      excursion: initial.excursion ?? "",
      vehicle: initial.vehicle ?? "",
      adults: 2,
      children: 0,
      customer: { name: "", email: "" },
      startDate: "",
    },
  });
  const type = useWatch({ control, name: "type" });
  const lock = useSubmitLock();

  const onSubmit = lock(handleSubmit(async (values) => {
    setFailure(null);
    const payload = clean({ ...values, locale });
    for (const k of ["tour", "excursion", "vehicle"] as const) if (k !== values.type) delete payload[k];
    const res = await submitPublic<{ reference: string }>("/bookings", payload);
    if (res.ok && res.data) {
      setReference(res.data.reference);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      applyServerErrors(res.errors, setError as never);
      setFailure(t(failureKey(res)));
    }
  }));

  if (reference) return <SuccessPanel title={t("successTitle")} text={t("success")} extra={t("reference", { reference })} />;

  const options: Record<string, Option[]> = { tour: tours, excursion: excursions, vehicle: vehicles };
  const e = errors;

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid gap-5 rounded-3xl bg-white p-6 shadow-card sm:grid-cols-2 sm:p-10" data-testid="booking-form">
      <h2 className="text-2xl text-forest-900 sm:col-span-2">{t("formTitle")}</h2>
      <Honeypot register={register as never} />
      <Field label={t("type")} htmlFor="type" className="sm:col-span-2">
        <Select id="type" {...register("type")}>
          <option value="general">{t("general")}</option>
          {tours.length > 0 && <option value="tour">{t("tour")}</option>}
          {excursions.length > 0 && <option value="excursion">{t("excursion")}</option>}
          {vehicles.length > 0 && <option value="vehicle">{t("vehicle")}</option>}
        </Select>
      </Field>
      {type !== "general" && (
        <Field label={t(type)} htmlFor={type} required error={e[type]?.message} className="sm:col-span-2">
          <Select id={type} aria-invalid={!!e[type]} {...register(type)}>
            <option value="">{t("select")}</option>
            {options[type].map((o) => (
              <option key={o.id} value={o.id}>
                {o.label}
              </option>
            ))}
          </Select>
        </Field>
      )}
      <Field label={t("name")} htmlFor="name" required error={e.customer?.name?.message}>
        <Input id="name" autoComplete="name" aria-invalid={!!e.customer?.name} {...register("customer.name")} />
      </Field>
      <Field label={t("email")} htmlFor="email" required error={e.customer?.email?.message}>
        <Input id="email" type="email" autoComplete="email" aria-invalid={!!e.customer?.email} {...register("customer.email")} />
      </Field>
      <Field label={t("whatsapp")} htmlFor="whatsapp" error={e.customer?.whatsapp?.message}>
        <Input id="whatsapp" type="tel" autoComplete="tel" {...register("customer.whatsapp")} />
      </Field>
      <Field label={t("country")} htmlFor="country">
        <Input id="country" autoComplete="country-name" {...register("customer.country")} />
      </Field>
      <Field label={t("startDate")} htmlFor="startDate" required error={e.startDate?.message}>
        <Input id="startDate" type="date" aria-invalid={!!e.startDate} {...register("startDate")} />
      </Field>
      <Field label={t("endDate")} htmlFor="endDate" error={e.endDate?.message}>
        <Input id="endDate" type="date" {...register("endDate")} />
      </Field>
      <Field label={t("adults")} htmlFor="adults" required error={e.adults?.message}>
        <Input id="adults" type="number" min={1} max={100} {...register("adults", { valueAsNumber: true })} />
      </Field>
      <Field label={t("children")} htmlFor="children" error={e.children?.message}>
        <Input id="children" type="number" min={0} max={100} {...register("children", { valueAsNumber: true })} />
      </Field>
      <Field label={t("pickup")} htmlFor="pickup" className="sm:col-span-2">
        <Input id="pickup" {...register("pickupLocation")} />
      </Field>
      <Field label={t("message")} htmlFor="message" className="sm:col-span-2">
        <Textarea id="message" {...register("message")} />
      </Field>
      {failure && (
        <p role="alert" className="rounded-xl bg-red-50 p-3 text-sm text-red-700 sm:col-span-2">
          {failure}
        </p>
      )}
      <div className="sm:col-span-2">
        <button type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg", "w-full sm:w-auto")}>
          {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {isSubmitting ? tc("sending") : t("submit")}
        </button>
      </div>
    </form>
  );
}
