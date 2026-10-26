"use client";

import { useMemo, useRef, useState } from "react";
import { useForm, useWatch, type FieldPath } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useLocale, useTranslations } from "next-intl";
import { Check, Loader2 } from "lucide-react";
import {
  ACCOMMODATION_TYPES,
  EXTRA_SERVICES,
  HOLIDAY_TYPES,
  MEAL_PLANS,
  TRANSPORT_METHODS,
  TRAVEL_TYPES,
  VEHICLE_TYPES,
  clean,
  tailorMadeSchema,
  type TailorMadeValues,
} from "@/validations/public";
import { submitPublic } from "@/lib/api/public-client";
import { DIAL_CODES } from "@/lib/dial-codes";
import { cn } from "@/lib/utils";
import { buttonClass } from "@/components/ui/Button";
import { Field, Honeypot, Input, Select, SuccessPanel, Textarea, applyServerErrors, failureKey, failureType, useSubmitLock } from "./fields";
import { track } from "@/lib/analytics";
import { useValidationMessages } from "./useValidationMessages";

const STEPS = ["trip", "holiday", "stay", "requirements", "dates", "contact"] as const;
type Step = (typeof STEPS)[number];

const STEP_FIELDS: Record<Step, FieldPath<TailorMadeValues>[]> = {
  trip: ["trip.travelType", "trip.vehicleType", "trip.transportMethod"],
  holiday: ["interests"],
  stay: ["accommodation", "mealPlan", "services"],
  requirements: ["additionalRequirements"],
  dates: ["travelers.adults", "travelers.children", "travel.arrivalDate", "travel.departureDate"],
  contact: ["personal.firstName", "personal.email", "whatsappCountry", "whatsappNumber"],
};

/** API paths that live under a different form field. */
const SERVER_PATHS: Record<string, FieldPath<TailorMadeValues>> = { "personal.whatsapp": "whatsappNumber" };

/** 6-step tailor-made tour planner → POST /api/tailor-made-enquiries */
export function TailorMadeForm() {
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
      trip: { travelType: "", vehicleType: "", transportMethod: "" },
      interests: [],
      accommodation: "",
      mealPlan: "",
      services: [],
      travelers: { adults: 2, children: 0 },
      travel: { arrivalDate: "", departureDate: "" },
      personal: { firstName: "", email: "" },
      whatsappCountry: "United States",
      whatsappNumber: "",
    },
  });

  const lock = useSubmitLock();
  const current = STEPS[step];
  const last = step === STEPS.length - 1;
  const values = useWatch({ control }) as TailorMadeValues;

  const started = useRef(false);
  const next = async () => {
    const ok = await trigger(STEP_FIELDS[current]);
    if (ok) {
      // Counted once, when the visitor completes the first step (not on mere page views).
      if (!started.current) {
        started.current = true;
        track("start_trip_inquiry", { form: "tailor_made" });
      }
      setStep((s) => Math.min(s + 1, STEPS.length - 1));
      document.getElementById("tm-top")?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };
  const back = () => setStep((s) => Math.max(0, s - 1));

  const toggle = (field: "interests" | "services", value: string) => {
    const list: string[] = getValues(field) ?? [];
    setValue(field, (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]) as never, { shouldDirty: true, shouldValidate: true });
  };

  const firstStepWithError = (errs: object) => STEPS.findIndex((s) => STEP_FIELDS[s].some((f) => f.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], errs)));

  const onSubmit = lock(
    handleSubmit(
      async (v) => {
        setFailure(null);
        const code = DIAL_CODES.find((d) => d.country === v.whatsappCountry)?.code ?? "";
        const payload = clean({
          trip: v.trip,
          interests: v.interests,
          accommodation: v.accommodation,
          mealPlan: v.mealPlan,
          services: v.services,
          additionalRequirements: v.additionalRequirements,
          travelers: v.travelers,
          travel: v.travel,
          personal: { ...v.personal, whatsapp: `${code} ${v.whatsappNumber}`.trim() },
          locale,
          website: v.website,
        });
        track("submit_trip_inquiry", { form: "tailor_made" });
        const res = await submitPublic<{ reference: string }>("/tailor-made-enquiries", payload);
        if (res.ok && res.data) {
          track("trip_inquiry_success", { form: "tailor_made" });
          setReference(res.data.reference);
          document.getElementById("tm-top")?.scrollIntoView({ behavior: "smooth" });
        } else {
          const errs = res.errors.map((er) => ({ ...er, path: SERVER_PATHS[er.path] ?? er.path }));
          applyServerErrors(errs, setError as never);
          setFailure(tb(failureKey(res)));
          track("trip_inquiry_error", { form: "tailor_made", error_type: failureType(res) });
          // Server-side field errors: jump back to the step that contains the first one.
          const bad = STEPS.findIndex((s) => STEP_FIELDS[s].some((f) => errs.some((er) => er.path === f || er.path.startsWith(`${f}.`) || f.startsWith(`${er.path}.`))));
          if (bad >= 0) setStep(bad);
        }
      },
      (errs) => {
        // Jump back to the first step that has an error (uses the fresh errors, not the render-time snapshot).
        const firstBad = firstStepWithError(errs);
        if (firstBad >= 0) setStep(firstBad);
      },
    ),
  );

  if (reference) return <SuccessPanel title={t("successTitle")} text={t("success")} extra={tb("reference", { reference })} />;

  const e = errors;
  const chip = (selected: boolean) =>
    cn(
      "flex items-center gap-2 rounded-2xl border px-4 py-3 text-start text-sm transition-colors",
      selected ? "border-forest-700 bg-forest-50 text-heading" : "border-sand-200 bg-surface hover:border-forest-600",
    );
  const box = (selected: boolean) => (
    <span className={cn("flex h-5 w-5 shrink-0 items-center justify-center rounded-md border", selected ? "border-forest-700 bg-forest-700 text-white" : "border-sand-200")}>
      {selected && <Check className="h-3.5 w-3.5" />}
    </span>
  );
  const legend = (text: string, required?: boolean) => (
    <legend className="mb-3 text-sm font-medium text-heading">
      {text}
      {required && <span className="text-red-600"> *</span>}
    </legend>
  );
  const fieldError = (message?: string) =>
    message && (
      <p className="mt-2 text-xs text-red-600" role="alert">
        {message}
      </p>
    );

  return (
    <div id="tm-top" className="scroll-mt-28">
      {/* Stepper (design): numbered circles on a line – done steps are checked and clickable, the current one is gold. */}
      <div className="mb-10">
        <ol className="relative flex items-center justify-between" aria-label={t("stepOf", { current: step + 1, total: STEPS.length })}>
          <span className="absolute inset-x-3 top-1/2 z-0 h-px -translate-y-1/2 bg-sand-200" aria-hidden />
          <span
            className="absolute inset-s-3 top-1/2 h-0.5 -translate-y-1/2 bg-gold-500 transition-all duration-500"
            style={{ width: `calc((100% - 1.5rem) * ${step / (STEPS.length - 1)})` }}
            aria-hidden
          />
          {STEPS.map((s, i) => (
            <li key={s} className="relative">
              <button
                type="button"
                onClick={() => i < step && setStep(i)}
                aria-current={i === step ? "step" : undefined}
                aria-label={`${i + 1}. ${t(`steps.${s}`)}`}
                disabled={i > step}
                className={cn(
                  "relative flex h-7 w-7 items-center justify-center rounded-full text-xs font-semibold ring-4 ring-sand-50 transition-colors after:absolute after:inset-x-0 after:-inset-y-1.5 after:content-[''] sm:h-8 sm:w-8",
                  i === step
                    ? "bg-gold-500 text-forest-950"
                    : i < step
                      ? "bg-forest-800 text-white hover:bg-forest-700"
                      : "bg-surface text-muted ring-sand-50 [box-shadow:inset_0_0_0_1px_var(--color-sand-200)]",
                )}
              >
                {i < step ? <Check className="h-3 w-3 sm:h-3.5 sm:w-3.5" aria-hidden /> : i + 1}
              </button>
            </li>
          ))}
        </ol>
        <p className="mt-5 flex items-baseline justify-between gap-4">
          <span className="font-display text-2xl text-heading">
            {step + 1}. {t(`steps.${current}`)}
          </span>
          <span className="shrink-0 text-sm text-muted">{t("stepOf", { current: step + 1, total: STEPS.length })}</span>
        </p>
      </div>

      <form
        onSubmit={(e) => {
          if (last) return onSubmit(e);
          e.preventDefault(); // Enter on intermediate steps advances instead of submitting
          void next();
        }}
        noValidate
        className="relative rounded-3xl bg-surface p-6 shadow-card sm:p-10"
        data-testid="tailor-made-form"
      >
        <Honeypot register={register as never} />
        <h2 className="mb-6 text-2xl text-heading">{t(`steps.${current}`)}</h2>

        {current === "trip" && (
          <div className="grid grid-cols-1 gap-6">
            <Field label={t("travelType")} htmlFor="travelType" required error={e.trip?.travelType?.message}>
              <Select id="travelType" {...register("trip.travelType")}>
                <option value="">{t("selectPlaceholder")}</option>
                {TRAVEL_TYPES.map((k) => (
                  <option key={k} value={k}>
                    {t(`travelTypes.${k}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <fieldset>
              {legend(t("vehicleType"), true)}
              <div className="grid grid-cols-3 gap-3">
                {VEHICLE_TYPES.map((k) => (
                  <label key={k} className={cn(chip(values.trip?.vehicleType === k), "cursor-pointer justify-center")}>
                    <input type="radio" value={k} className="sr-only" {...register("trip.vehicleType")} />
                    {t(`vehicleTypes.${k}`)}
                  </label>
                ))}
              </div>
              {fieldError(e.trip?.vehicleType?.message)}
            </fieldset>
            <Field label={t("transportMethod")} htmlFor="transportMethod" required error={e.trip?.transportMethod?.message}>
              <Select id="transportMethod" {...register("trip.transportMethod")}>
                <option value="">{t("selectPlaceholder")}</option>
                {TRANSPORT_METHODS.map((k) => (
                  <option key={k} value={k}>
                    {t(`transportMethods.${k}`)}
                  </option>
                ))}
              </Select>
            </Field>
          </div>
        )}

        {current === "holiday" && (
          <fieldset>
            {legend(t("holidayType"), true)}
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {HOLIDAY_TYPES.map((k) => {
                const selected = !!values.interests?.includes(k);
                return (
                  <button key={k} type="button" aria-pressed={selected} onClick={() => toggle("interests", k)} className={chip(selected)}>
                    {box(selected)}
                    {t(`holidayTypes.${k}`)}
                  </button>
                );
              })}
            </div>
            {fieldError(e.interests?.message)}
          </fieldset>
        )}

        {current === "stay" && (
          <div className="grid grid-cols-1 gap-6">
            <fieldset>
              {legend(t("accommodation"), true)}
              <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                {ACCOMMODATION_TYPES.map((k) => (
                  <label key={k} className={cn(chip(values.accommodation === k), "cursor-pointer justify-center text-center")}>
                    <input type="radio" value={k} className="sr-only" {...register("accommodation")} />
                    {t(`accommodationTypes.${k}`)}
                  </label>
                ))}
              </div>
              {fieldError(e.accommodation?.message)}
            </fieldset>
            <Field label={t("mealPlan")} htmlFor="mealPlan">
              <Select id="mealPlan" {...register("mealPlan")}>
                <option value="">{t("selectPlaceholder")}</option>
                {MEAL_PLANS.map((k) => (
                  <option key={k} value={k}>
                    {t(`mealPlans.${k}`)}
                  </option>
                ))}
              </Select>
            </Field>
            <fieldset>
              {legend(t("services"))}
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {EXTRA_SERVICES.map((k) => {
                  const selected = !!values.services?.includes(k);
                  return (
                    <button key={k} type="button" aria-pressed={selected} onClick={() => toggle("services", k)} className={chip(selected)}>
                      {box(selected)}
                      {t(`extraServices.${k}`)}
                    </button>
                  );
                })}
              </div>
            </fieldset>
          </div>
        )}

        {current === "requirements" && (
          <Field label={t("myRequirements")} htmlFor="requirements">
            <Textarea id="requirements" placeholder={t("requirementsPlaceholder")} className="min-h-40" {...register("additionalRequirements")} />
          </Field>
        )}

        {current === "dates" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={tb("adults")} htmlFor="tmAdults" required error={e.travelers?.adults?.message}>
              <Input id="tmAdults" type="number" min={1} {...register("travelers.adults", { valueAsNumber: true })} />
            </Field>
            <Field label={tb("children")} htmlFor="tmChildren">
              <Input id="tmChildren" type="number" min={0} {...register("travelers.children", { valueAsNumber: true })} />
            </Field>
            <Field label={t("startDate")} htmlFor="arrivalDate" required error={e.travel?.arrivalDate?.message}>
              <Input id="arrivalDate" type="date" {...register("travel.arrivalDate")} />
            </Field>
            <Field label={t("endDate")} htmlFor="departureDate" required error={e.travel?.departureDate?.message}>
              <Input id="departureDate" type="date" {...register("travel.departureDate")} />
            </Field>
          </div>
        )}

        {current === "contact" && (
          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label={t("name")} htmlFor="tmName" required error={e.personal?.firstName?.message}>
              <Input id="tmName" autoComplete="name" {...register("personal.firstName")} />
            </Field>
            <Field label={tb("email")} htmlFor="tmEmail" required error={e.personal?.email?.message}>
              <Input id="tmEmail" type="email" autoComplete="email" {...register("personal.email")} />
            </Field>
            <Field label={t("whatsappNumber")} htmlFor="tmWhatsapp" required error={e.whatsappNumber?.message ?? e.whatsappCountry?.message} className="sm:col-span-2">
              <div className="flex gap-2">
                <Select aria-label={t("countryCode")} className="max-w-36 shrink-0 sm:max-w-52" {...register("whatsappCountry")}>
                  {DIAL_CODES.map((d) => (
                    <option key={d.country} value={d.country}>
                      {d.code} {d.country}
                    </option>
                  ))}
                </Select>
                <Input id="tmWhatsapp" type="tel" autoComplete="tel-national" className="min-w-0 flex-1" aria-invalid={!!e.whatsappNumber} {...register("whatsappNumber")} />
              </div>
            </Field>
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
          {last ? (
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
