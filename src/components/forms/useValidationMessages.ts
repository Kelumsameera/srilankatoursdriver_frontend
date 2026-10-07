"use client";

import { useMemo } from "react";
import { useTranslations } from "next-intl";
import type { ValidationMessages } from "@/validations/public";

export function useValidationMessages(): ValidationMessages {
  const t = useTranslations("validation");
  return useMemo(
    () => ({
      required: t("required"),
      email: t("email"),
      minLength: (min: number) => t("minLength", { min }),
      min: (min: number) => t("min", { min }),
      future: t("future"),
      after: t("after"),
      select: t("select"),
    }),
    [t],
  );
}
