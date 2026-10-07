import { useTranslations } from "next-intl";
import { ButtonLink } from "@/components/ui/Button";

export default function LocaleNotFound() {
  const t = useTranslations("errors");
  return (
    <section className="flex min-h-[80vh] items-center bg-forest-900 text-white">
      <div className="container-page py-40 text-center">
        <p className="font-display text-8xl text-gold-500">404</p>
        <h1 className="mt-4 text-4xl">{t("notFoundTitle")}</h1>
        <p className="mx-auto mt-4 max-w-md text-white/75">{t("notFoundText")}</p>
        <ButtonLink href="/" className="mt-8">
          {t("goHome")}
        </ButtonLink>
      </div>
    </section>
  );
}
