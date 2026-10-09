import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { ResetPasswordForm } from "@/components/account/PasswordResetForms";

type Props = { params: Promise<{ locale: string }>; searchParams: Promise<{ token?: string | string[] }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "account" });
  // The token is in the URL: never leak it to other sites as a referrer.
  return { title: t("resetTitle"), robots: { index: false, follow: false }, referrer: "no-referrer" };
}

export default async function Page({ params, searchParams }: Props) {
  const { locale } = await params;
  setRequestLocale(locale);
  const { token } = await searchParams;
  return (
    <section className="min-h-[80vh] bg-forest-900 pb-20 pt-32 sm:pt-36">
      <div className="container-page">
        <ResetPasswordForm token={typeof token === "string" ? token : ""} />
      </div>
    </section>
  );
}
