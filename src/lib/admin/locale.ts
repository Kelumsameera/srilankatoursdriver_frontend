import { cookies } from "next/headers";
import { ADMIN_LOCALE_COOKIE, isAdminLocale, type AdminLocale } from "@/features/admin/i18n";

/** The admin panel language from its cookie (server layouts only). English when unset. */
export async function getAdminLocale(): Promise<AdminLocale> {
  const value = (await cookies()).get(ADMIN_LOCALE_COOKIE)?.value;
  return isAdminLocale(value) ? value : "en";
}
