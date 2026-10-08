"use client";

import { useMemo, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import { clean, tailorMadeSchema, type TailorMadeValues } from "@/validations/public";
import { submitPublic } from "@/lib/api/public-client";
import { cn, formatDate } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { Field, Honeypot, Input, Select, SuccessPanel, Textarea, applyServerErrors, failureKey, useSubmitLock } from "./fields";
import { useValidationMessages } from "./useValidationMessages";

interface Option {
  id: string;
  label: string;
}

const STEPS = [
  "personal",
  "dates",
  "travelers",
  "arrival",
  "departure",
  "destinations",
  "interests",
  "hotels",
  "vehicle",
  "budget",
  "requirements",
  "review",
] as const;
type Step = (typeof STEPS)[number];

const STEP_FIELDS: Record<Step, FieldPath<TailorMadeValues>[]> = {
  personal: ["personal.firstName", "personal.lastName", "personal.email", "personal.phone", "personal.whatsapp", "personal.country"],
  dates: ["travel.arrivalDate", "travel.departureDate"],
  travelers: ["travelers.adults", "travelers.children", "travelers.infants"],
  arrival: ["arrival"],
  departure: ["departure"],
  destinations: ["destinations", "otherDestinations"],
  interests: ["interests"],
  hotels: ["hotels"],
  vehicle: ["vehicle"],
  budget: ["budget.amount", "budget.currency"],
  requirements: ["additionalRequirements"],
  review: [],
};

const INTERESTS = ["culture", "wildlife", "beach", "hiking", "tea", "food", "adventure", "wellness", "photography", "surfing", "whales", "religion"] as const;
const CURRENCIES = ["USD", "EUR", "GBP", "AUD", "CAD", "CHF", "INR", "JPY", "CNY", "LKR"];

/** 12-step tailor-made tour planner → POST /api/tailor-made-enquiries */
export function TailorMadeForm({ destinations, vehicles, defaultCurrency = "USD" }: { destinations: Option[]; vehicles: Option[]; defaultCurrency?: string }) {
  const t = useTranslations("tailorMade");
  const tb = useTranslations("booking");
  const tc = useTranslations("common");
  const locale = useLocale();
  const messages = useValidationMessages();
  const schema = useMemo(() => tailorMadeSchema(messages), [messages]);
  const [step, setStep] = useState(0);
  const [reference, setReference] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    trigger,
    control,
    setValue,
    setError,
    getValues,
    formState: { errors, isSubmitting },
  } = useForm<TailorMadeValues>({
    resolver: zodResolver(schema),
    mode: "onTouched",
    defaultValues: {
      personal: { firstName: "", email: "" },
      travel: { arrivalDate: "", departureDate: "", flexibleDates: false },
      travelers: { adults: 2, children: 0, infants: 0 },
      arrival: { airport: "Bandaranaike International Airport (CMB)", needsTransfer: true },
      departure: { airport: "Bandaranaike International Airport (CMB)", needsTransfer: true },
      destinations: [],
      interests: [],
      hotels: { category: "standard" },
      vehicle: { vehicleRef: "" },
      budget: { currency: CURRENCIES.includes(defaultCurrency) ? defaultCurrency : "USD", perPerson: true },
    },
  });

  const lock = useSubmitLock();
  const current = STEPS[step];
  const values = useWatch({ control }) as TailorMadeValues;

  const next = async () => {
    const ok = await trigger(STEP_FIELDS[current]);
    if (ok) {
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      document.getElementById("tm-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const toggle = (field: "destinations" | "interests", value: string) => {
    const list = getValues(field) ?? [];
    setValue(field, list.includes(value) ? list.filter((v) => v !== value) : [...list, value], { shouldDirty: true });
  };

  const firstStepWithError = (errs: object) =>
    STEPS.findIndex((s) => STEP_FIELDS[s].some((f) => f.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], errs)));

  const onSubmit = lock(handleSubmit(
    async (v) => {
      setFailure(null);
      const payload = clean({ ...v, locale, vehicle: { ...v.vehicle, vehicleRef: v.vehicle.vehicleRef || undefined } });
      const res = await submitPublic<{ reference: string }>("/tailor-made-enquiries", payload);
      if (res.ok && res.data) {
        setReference(res.data.reference);
        document.getElementById("tm-top")?.scrollIntoView({ behavior: "smooth" });
      } else {
        applyServerErrors(res.errors, setError as never);
        setFailure(tb(failureKey(res)));
        // Server-side field errors: jump back to the step that contains the first one.
        const bad = STEPS.findIndex((s) =>
          STEP_FIELDS[s].some((f) => res.errors.some((er) => er.path === f || er.path.startsWith(`${f}.`) || f.startsWith(`${er.path}.`))),
        );
        if (bad >= 0) setStep(bad);
      }
    },
    (errs) => {
      // Jump back to the first step that has an error (uses the fresh errors, not the render-time snapshot).
      const firstBad = firstStepWithError(errs);
      if (firstBad >= 0) setStep(firstBad);
    },
  ));

  if (reference) return <SuccessPanel title={t("successTitle")} text={t("success")} extra={tb("reference", { reference })} />;

  const e = errors;
  const chip = (selected: boolean) =>
    cn(
      "flex items-center gap-2 rounded-2xl border px-4 py-3 text-start text-sm transition-colors",
      selected ? "border-forest-700 bg-forest-50 text-forest-900" : "border-sand-200 bg-white hover:border-forest-600",
    );

  return (
    <div id="tm-top" className="scroll-mt-28">
      <div className="mb-8">
        <div className="mb-3 flex items-center justify-between text-sm">
          <span className="font-medium text-forest-900">{t(`steps.${current}`)}</span>
          <span className="text-muted">{t("stepOf", { current: step + 1, total: STEPS.length })}</span>
        </div>
        <div className="h-1.5 overflow-hidden rounded-full bg-sand-200" role="progressbar" aria-valuemin={1} aria-valuemax={STEPS.length} aria-valuenow={step + 1}>
          <div className="h-full rounded-full bg-gold-500 transition-all duration-500" style={{ width: `${((step + 1) / STEPS.length) * 100}%` }} />
        </div>
        <ol className="mt-4 hidden flex-wrap gap-2 lg:flex">
          {STEPS.map((s, i) => (
            <li key={s}>
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                aria-current={i === step ? "step" : undefined}
                disabled={i > step}
                className={cn(
                  "rounded-full px-3 py-1 text-xs",
                  i === step ? "bg-forest-800 text-white" : i < step ? "bg-forest-100 text-forest-800 hover:bg-forest-50" : "bg-sand-100 text-muted",
                )}
              >
                {i + 1}. {t(`steps.${s}`)}
              </button>
            </li>
          ))}
        </ol>
      </div>

      <form
        onSubmit={(e) => {
          if (current === "review") return onSubmit(e);
          e.preventDefault(); // Enter on intermediate steps advances instead of submitting
          void next();
        }}
        noValidate
        className="relative rounded-3xl bg-white p-6 shadow-card sm:p-10" data-testid="tailor-made-form">
        <Honeypot register={register as never} />
        <h2 className="mb-6 text-2xl text-forest-900">{t(`steps.${current}`)}</h2>

        {current === "personal" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("firstName")} htmlFor="firstName" required error={e.personal?.firstName?.message}>
              <Input id="firstName" autoComplete="given-name" aria-invalid={!!e.personal?.firstName} {...register("personal.firstName")} />
            </Field>
            <Field label={t("lastName")} htmlFor="lastName">
              <Input id="lastName" autoComplete="family-name" {...register("personal.lastName")} />
            </Field>
            <Field label={tb("email")} htmlFor="tmEmail" required error={e.personal?.email?.message}>
              <Input id="tmEmail" type="email" autoComplete="email" aria-invalid={!!e.personal?.email} {...register("personal.email")} />
            </Field>
            <Field label={tb("whatsapp")} htmlFor="tmWhatsapp" error={e.personal?.whatsapp?.message}>
              <Input id="tmWhatsapp" type="tel" autoComplete="tel" {...register("personal.whatsapp")} />
            </Field>
            <Field label={tb("phone")} htmlFor="tmPhone" error={e.personal?.phone?.message}>
              <Input id="tmPhone" type="tel" {...register("personal.phone")} />
            </Field>
            <Field label={tb("country")} htmlFor="tmCountry">
              <Input id="tmCountry" autoComplete="country-name" {...register("personal.country")} />
            </Field>
          </div>
        )}

        {current === "dates" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("arrivalDate")} htmlFor="arrivalDate" required error={e.travel?.arrivalDate?.message}>
              <Input id="arrivalDate" type="date" aria-invalid={!!e.travel?.arrivalDate} {...register("travel.arrivalDate")} />
            </Field>
            <Field label={t("departureDate")} htmlFor="departureDate" required error={e.travel?.departureDate?.message}>
              <Input id="departureDate" type="date" aria-invalid={!!e.travel?.departureDate} {...register("travel.departureDate")} />
            </Field>
            <label className="flex items-center gap-3 text-sm sm:col-span-2">
              <input type="checkbox" className="h-5 w-5 accent-forest-700" {...register("travel.flexibleDates")} />
              {t("flexibleDates")}
            </label>
          </div>
        )}

        {current === "travelers" && (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={tb("adults")} htmlFor="tmAdults" required error={e.travelers?.adults?.message}>
              <Input id="tmAdults" type="number" min={1} {...register("travelers.adults", { valueAsNumber: true })} />
            </Field>
            <Field label={tb("children")} htmlFor="tmChildren">
              <Input id="tmChildren" type="number" min={0} {...register("travelers.children", { valueAsNumber: true })} />
            </Field>
            <Field label={t("infants")} htmlFor="tmInfants">
              <Input id="tmInfants" type="number" min={0} {...register("travelers.infants", { valueAsNumber: true })} />
            </Field>
            <Field label={t("childAges")} htmlFor="childAges" className="sm:col-span-3">
              <Input id="childAges" {...register("travelers.childAges")} />
            </Field>
          </div>
        )}

        {(current === "arrival" || current === "departure") && (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t("airport")} htmlFor={`${current}Airport`} className="sm:col-span-3">
              <Input id={`${current}Airport`} {...register(`${current}.airport`)} />
            </Field>
            <Field label={t("flightNumber")} htmlFor={`${current}Flight`}>
              <Input id={`${current}Flight`} {...register(`${current}.flightNumber`)} />
            </Field>
            <Field label={t("time")} htmlFor={`${current}Time`}>
              <Input id={`${current}Time`} type="time" {...register(`${current}.time`)} />
            </Field>
            <label className="flex items-center gap-3 self-end pb-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-forest-700" {...register(`${current}.needsTransfer`)} />
              {t("needsTransfer")}
            </label>
          </div>
        )}

        {current === "destinations" && (
          <div>
            <p className="mb-4 text-muted">{t("chooseDestinations")}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {destinations.map((d) => {
                const selected = values.destinations?.includes(d.id);
                return (
                  <button key={d.id} type="button" aria-pressed={selected} onClick={() => toggle("destinations", d.id)} className={chip(!!selected)}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-forest-700 bg-forest-700 text-white" : "border-sand-200")}>
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    {d.label}
                  </button>
                );
              })}
            </div>
            <Field label={t("otherDestinations")} htmlFor="otherDestinations" className="mt-6">
              <Textarea id="otherDestinations" className="min-h-20" {...register("otherDestinations")} />
            </Field>
          </div>
        )}

        {current === "interests" && (
          <div>
            <p className="mb-4 text-muted">{t("chooseInterests")}</p>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
              {INTERESTS.map((key) => {
                const label = t(`interests.${key}`);
                const selected = values.interests?.includes(key);
                return (
                  <button key={key} type="button" aria-pressed={selected} onClick={() => toggle("interests", key)} className={chip(!!selected)}>
                    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-forest-700 bg-forest-700 text-white" : "border-sand-200")}>
                      {selected && <Check className="h-3.5 w-3.5" />}
                    </span>
                    {label}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {current === "hotels" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <fieldset className="sm:col-span-2">
              <legend className="mb-3 text-sm font-medium text-forest-900">{t("hotelCategory")}</legend>
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-5">
                {(["budget", "standard", "boutique", "luxury", "mixed"] as const).map((c) => (
                  <label key={c} className={cn(chip(values.hotels?.category === c), "cursor-pointer justify-center")}>
                    <input type="radio" value={c} className="sr-only" {...register("hotels.category")} />
                    {t(c === "budget" ? "budgetHotel" : c)}
                  </label>
                ))}
              </div>
            </fieldset>
            <Field label={t("roomType")} htmlFor="roomType">
              <Input id="roomType" {...register("hotels.roomType")} />
            </Field>
            <Field label={t("notes")} htmlFor="hotelNotes">
              <Input id="hotelNotes" {...register("hotels.notes")} />
            </Field>
          </div>
        )}

        {current === "vehicle" && (
          <div className="grid gap-5 sm:grid-cols-2">
            <Field label={t("vehiclePreference")} htmlFor="vehicleRef">
              <Select id="vehicleRef" {...register("vehicle.vehicleRef")}>
                <option value="">{t("noPreference")}</option>
                {vehicles.map((v) => (
                  <option key={v.id} value={v.id}>
                    {v.label}
                  </option>
                ))}
              </Select>
            </Field>
            <Field label={t("notes")} htmlFor="vehicleNotes">
              <Input id="vehicleNotes" {...register("vehicle.preference")} />
            </Field>
          </div>
        )}

        {current === "budget" && (
          <div className="grid gap-5 sm:grid-cols-3">
            <Field label={t("budgetAmount")} htmlFor="budgetAmount" error={e.budget?.amount?.message}>
              <Input id="budgetAmount" type="number" min={0} step={50} {...register("budget.amount", { valueAsNumber: true })} />
            </Field>
            <Field label={t("currency")} htmlFor="budgetCurrency">
              <Select id="budgetCurrency" {...register("budget.currency")}>
                {CURRENCIES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </Select>
            </Field>
            <label className="flex items-center gap-3 self-end pb-3 text-sm">
              <input type="checkbox" className="h-5 w-5 accent-forest-700" {...register("budget.perPerson")} />
              {t("perPerson")}
            </label>
            <Field label={t("budgetRange")} htmlFor="budgetRange" className="sm:col-span-3">
              <Input id="budgetRange" {...register("budget.range")} />
            </Field>
          </div>
        )}

        {current === "requirements" && (
          <Field label={t("requirements")} htmlFor="requirements">
            <Textarea id="requirements" placeholder={t("requirementsPlaceholder")} className="min-h-40" {...register("additionalRequirements")} />
          </Field>
        )}

        {current === "review" && (
          <div>
            <p className="mb-6 text-muted">{t("reviewIntro")}</p>
            <dl className="grid gap-x-8 gap-y-5 rounded-2xl bg-sand-50 p-6 text-sm sm:grid-cols-2">
              {[
                ["personal", `${values.personal.firstName} ${values.personal.lastName ?? ""} · ${values.personal.email}`],
                ["dates", `${formatDate(values.travel.arrivalDate, locale)} → ${formatDate(values.travel.departureDate, locale)}`],
                ["travelers", `${tb("adults")}: ${values.travelers.adults} · ${tb("children")}: ${values.travelers.children || 0} · ${t("infants")}: ${values.travelers.infants || 0}`],
                ["destinations", [...destinations.filter((d) => values.destinations.includes(d.id)).map((d) => d.label), values.otherDestinations].filter(Boolean).join(", ") || "—"],
                ["interests", values.interests.map((i) => t(`interests.${i as (typeof INTERESTS)[number]}`)).join(", ") || "—"],
                ["hotels", t(values.hotels.category === "budget" ? "budgetHotel" : values.hotels.category)],
                ["vehicle", vehicles.find((v) => v.id === values.vehicle.vehicleRef)?.label ?? t("noPreference")],
                ["budget", values.budget.amount ? `${values.budget.amount} ${values.budget.currency}${values.budget.perPerson ? ` (${t("perPerson")})` : ""}` : values.budget.range || "—"],
              ].map(([key, value]) => (
                <div key={key}>
                  <dt className="flex items-center justify-between text-xs uppercase tracking-wider text-muted">
                    {t(`steps.${key as Step}`)}
                    <button type="button" className="normal-case text-forest-600 underline" onClick={() => setStep(STEPS.indexOf(key as Step))}>
                      {t("edit")}
                    </button>
                  </dt>
                  <dd className="mt-1 text-forest-900">{value}</dd>
                </div>
              ))}
            </dl>
          </div>
        )}

        {failure && (
          <p role="alert" className="mt-6 rounded-xl bg-red-50 p-3 text-sm text-red-700">
            {failure}
          </p>
        )}

        <div className="mt-10 flex items-center justify-between gap-3">
          <button type="button" onClick={back} disabled={step === 0} className={buttonClass("outline", "md", step === 0 ? "invisible" : "")}>
            {tc("back")}
          </button>
          {current === "review" ? (
            <button key="submit" type="submit" disabled={isSubmitting} className={buttonClass("primary", "lg")}>
              {isSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
              {isSubmitting ? tc("sending") : t("submit")}
            </button>
          ) : (
            <button key="next" type="button" onClick={next} className={buttonClass("secondary", "md")}>
              {tc("next")}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
