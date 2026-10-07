"use client";

import { useEffect } from "react";
import { useTranslations } from "next-intl";
import { buttonClass } from "@/components/ui/Button";

export default function LocaleError({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const t = useTranslations("errors");
  const tc = useTranslations("common");
  useEffect(() => {
    console.error(error);
  }, [error]);
  return (
    <section className="flex min-h-[80vh] items-center bg-forest-900 text-white">
      <div className="container-page py-40 text-center">
        <h1 className="text-4xl">{t("errorTitle")}</h1>
        <p className="mx-auto mt-4 max-w-md text-white/75">{t("errorText")}</p>
        <button type="button" onClick={reset} className={buttonClass("primary", "md", "mt-8")}>
          {tc("retry")}
        </button>
      </div>
    </section>
  );
}
