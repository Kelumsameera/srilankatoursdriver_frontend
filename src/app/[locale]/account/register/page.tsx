import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { AuthForm } from "@/components/account/AuthForm";

type Props = { params: Promise<{ locale: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  return { title: t("registerTitle"), robots: { index: false, follow: false } };
}

export default async function Page({ params }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  // Dark band keeps the transparent header readable (these pages have no hero image).
  return (
    <section className="min-h-[80vh] bg-forest-900 pb-20 pt-32 sm:pt-36">
      <div className="container-page">
        <AuthForm mode="register" />
      </div>
    </section>
  );
}
