"use client";

import { useEffect, useMemo, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Loader2 } from "lucide-react";
import { bookingSchema, clean, MAX_CHILD_AGE, MAX_CHILD_AGES, type BookingValues } from "@/validations/public";
import { submitPublic } from "@/lib/api/public-client";
import { useCustomerAuth } from "@/lib/customer/auth";
import { Link } from "@/i18n/navigation";
import { buttonClass } from "@/components/ui/Button";
import { Field, Honeypot, Input, Select, SuccessPanel, Textarea, applyServerErrors, failureKey, failureType, useSubmitLock } from "./fields";
import { track } from "@/lib/analytics";
import { useValidationMessages } from "./useValidationMessages";
import { formatPrice } from "@/lib/utils";
import { groupPriceFor, maxGroupSize, tripEndDate } from "@/lib/group-price";
import type { GroupPrice } from "@/types/cms";

interface Option {
  id: string;
  label: string;
}

interface TourOption extends Option {
  days?: number;
  /** Category id: tours of the same family are offered as the other lengths. */
  family?: string;
  currency?: string;
  groupPrices?: GroupPrice[];
}

interface Props {
  tours: TourOption[];
  excursions: Option[];
  vehicles: Option[];
  initial: { type?: string; tour?: string; excursion?: string; vehicle?: string };
}

export function BookingForm({ tours, excursions, vehicles, initial }: Props) {
  const t = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale();
  const ta = useTranslations("account");
  const { customer } = useCustomerAuth();
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
    getValues,
    setValue,
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
  const [tourId, startDate, adults, children] = useWatch({ control, name: ["tour", "startDate", "adults", "children"] });

  // Price list: the selected tour, its other lengths (same category, also priced) and the price for this group
  const selectedTour = type === "tour" ? tours.find((x) => x.id === tourId) : undefined;
  const priced = selectedTour?.groupPrices?.length ? selectedTour : undefined;
  const lengths = priced ? tours.filter((x) => x.family === priced.family && x.groupPrices?.length && x.days).sort((a, b) => a.days! - b.days!) : [];
  const count = (n: number | undefined) => (typeof n === "number" && Number.isFinite(n) ? n : 0);
  const persons = count(adults) + count(children);
  const priceRow = groupPriceFor(priced?.groupPrices, persons);
  const maxPersons = maxGroupSize(priced?.groupPrices);
  const money = (amount: number) => formatPrice(amount, priced?.currency ?? "USD", locale);

  // Fill the end date from the start date and the tour's length
  useEffect(() => {
    const end = selectedTour?.days ? tripEndDate(startDate ?? "", selectedTour.days) : "";
    if (end) setValue("endDate", end, { shouldValidate: true });
  }, [selectedTour?.days, startDate, setValue]);

  // Signed-in customers: fill in the saved name/email (never overwriting what was already typed).
  useEffect(() => {
    if (!customer) return;
    if (!getValues("customer.name")) setValue("customer.name", customer.name);
    if (!getValues("customer.email")) setValue("customer.email", customer.email);
  }, [customer, getValues, setValue]);
  const lock = useSubmitLock();

  const onSubmit = lock(handleSubmit(async (values) => {
    setFailure(null);
    // Only the ages of the children still counted (the form keeps entries when the number goes down)
    const ages = (values.childrenAges ?? []).slice(0, Math.min(values.children ?? 0, MAX_CHILD_AGES));
    const payload = clean({ ...values, childrenAges: ages.length ? ages : undefined, locale });
    for (const k of ["tour", "excursion", "vehicle"] as const) if (k !== values.type) delete payload[k];
    track("submit_trip_inquiry", { form: "booking" });
    const res = await submitPublic<{ reference: string }>("/bookings", payload);
    if (res.ok && res.data) {
      track("trip_inquiry_success", { form: "booking" });
      setReference(res.data.reference);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } else {
      applyServerErrors(res.errors, setError as never);
      setFailure(t(failureKey(res)));
      track("trip_inquiry_error", { form: "booking", error_type: failureType(res) });
    }
  }));

  if (reference)
    return (
      <SuccessPanel
        title={t("successTitle")}
        text={t("success")}
        extra={
          <>
            {t("reference", { reference })}
            {customer && (
              <Link href="/account" className="mt-4 block font-sans text-sm text-white underline underline-offset-4 hover:text-gold-400">
                {ta("trackBooking")}
              </Link>
            )}
          </>
        }
      />
    );

  const options: Record<string, Option[]> = { tour: tours, excursion: excursions, vehicle: vehicles };
  const e = errors;

  return (
    <form onSubmit={onSubmit} noValidate className="relative grid grid-cols-1 gap-5 rounded-3xl bg-surface p-6 shadow-card sm:grid-cols-2 sm:p-10" data-testid="booking-form">
      <h2 className="text-2xl text-heading sm:col-span-2">{t("formTitle")}</h2>
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
      {lengths.length > 1 && (
        <Field label={t("tourLength")} htmlFor="tourLength" className="sm:col-span-2">
          <Select id="tourLength" value={priced?.id} onChange={(ev) => setValue("tour", ev.target.value, { shouldValidate: true })}>
            {lengths.map((o) => (
              <option key={o.id} value={o.id}>
                {t("daysOption", { days: o.days! })}
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
      {count(children) > 0 && (
        <fieldset className="grid grid-cols-2 gap-4 sm:col-span-2 sm:grid-cols-4" data-testid="children-ages">
          <legend className="mb-2 text-sm font-medium text-ink">{t("childrenAges")}</legend>
          {Array.from({ length: Math.min(count(children), MAX_CHILD_AGES) }, (_, i) => (
            <Field key={i} label={t("childAge", { n: i + 1 })} htmlFor={`childAge${i}`} required error={e.childrenAges?.[i]?.message}>
              <Select id={`childAge${i}`} aria-invalid={!!e.childrenAges?.[i]} {...register(`childrenAges.${i}`, { setValueAs: (v) => (v === "" || v === undefined ? Number.NaN : Number(v)) })}>
                <option value="">{t("select")}</option>
                {Array.from({ length: MAX_CHILD_AGE + 1 }, (_, age) => (
                  <option key={age} value={age}>
                    {age === 0 ? t("underOne") : t("ageYears", { age })}
                  </option>
                ))}
              </Select>
            </Field>
          ))}
        </fieldset>
      )}
      {priced && persons >= 1 && (
        <div className="rounded-2xl border border-gold-400/40 bg-sand-50 p-5 sm:col-span-2" aria-live="polite" data-testid="booking-price">
          {priceRow ? (
            <>
              <p className="text-xs font-semibold uppercase tracking-[0.14em] text-gold-600">{t("estimate")}</p>
              <p className="mt-1 font-display text-4xl text-brand">{money(priceRow.price)}</p>
              <p className="mt-1 text-sm text-ink">
                {t("estimateTotal", { count: persons, days: priced.days ?? 1 })}
                {priceRow.vehicle && <> · {t("vehicleLabel", { vehicle: priceRow.vehicle })}</>}
              </p>
              {persons > 1 && <p className="mt-0.5 text-sm text-muted">{t("perPerson", { price: money(Math.round(priceRow.price / persons)) ?? "" })}</p>}
              <p className="mt-3 text-xs text-muted">{t("estimateNote")}</p>
            </>
          ) : (
            <p className="text-sm text-ink">{t("largeGroup", { max: maxPersons })}</p>
          )}
        </div>
      )}
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
