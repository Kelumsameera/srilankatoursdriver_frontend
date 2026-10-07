"use client";

import { useEffect, useMemo, type ReactNode } from "react";
import { FormProvider, useForm } from "react-hook-form";
import { toast } from "sonner";
import { AdminApiError, errorMessage } from "@/lib/admin/api";
import { Button, Card } from "../ui";
import { FormField } from "./FormFields";
import { allFields, fromFormValues, toFormValues } from "./values";
import type { FormSection } from "./types";

interface Props {
  sections: FormSection[];
  initial?: Record<string, unknown>;
  onSubmit: (payload: Record<string, unknown>) => Promise<unknown>;
  submitLabel?: string;
  readOnly?: boolean;
  aside?: ReactNode;
  extraActions?: ReactNode;
}

/**
 * Generic CMS editor: renders configured sections/fields with react-hook-form,
 * converts values to an API payload and maps server-side (Zod) validation errors back onto fields.
 */
export function EntityForm({ sections, initial, onSubmit, submitLabel = "Save", readOnly, aside, extraActions }: Props) {
  const fields = useMemo(() => allFields(sections), [sections]);
  const defaults = useMemo(() => toFormValues(fields, initial ?? {}), [fields, initial]);
  const methods = useForm({ defaultValues: defaults });
  const { handleSubmit, reset, setError, formState } = methods;

  useEffect(() => {
    reset(defaults);
  }, [defaults, reset]);

  const submit = handleSubmit(
    async (values) => {
      try {
        await onSubmit(fromFormValues(fields, values));
        reset(values);
      } catch (err) {
        if (err instanceof AdminApiError && err.errors.length) {
          for (const e of err.errors) if (e.path) setError(e.path as never, { message: e.message });
        }
        toast.error(errorMessage(err));
      }
    },
    () => toast.error("Please fix the highlighted fields"),
  );

  return (
    <FormProvider {...methods}>
      <form onSubmit={submit} className="grid gap-6 xl:grid-cols-[1fr_320px]" noValidate>
        <div className="min-w-0 space-y-6">
          {sections.map((section) => (
            <Card key={section.title} title={section.title}>
              {section.description && <p className="-mt-1 mb-4 text-sm text-slate-500">{section.description}</p>}
              <fieldset disabled={readOnly} className={section.columns === 1 ? "grid gap-4" : "grid gap-4 sm:grid-cols-2"}>
                {section.fields.map((f) => (
                  <FormField key={f.name} field={f} path={f.name} />
                ))}
              </fieldset>
            </Card>
          ))}
        </div>
        <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
          {!readOnly && (
            <Card>
              <div className="flex flex-col gap-2">
                <Button type="submit" loading={formState.isSubmitting} data-testid="save-button">
                  {submitLabel}
                </Button>
                {extraActions}
                {formState.isDirty && <p className="text-center text-xs text-amber-600">Unsaved changes</p>}
              </div>
            </Card>
          )}
          {aside}
        </div>
      </form>
    </FormProvider>
  );
}
