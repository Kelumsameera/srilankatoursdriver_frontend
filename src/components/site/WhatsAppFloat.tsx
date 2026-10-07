import { getTranslations } from "next-intl/server";
import { whatsappLink } from "@/lib/utils";
import { SocialIcons } from "@/components/ui/icons";

/** Floating WhatsApp button – number & default message come from Site Settings. */
export async function WhatsAppFloat({ phone, message }: { phone?: string; message?: string }) {
  if (!phone) return null;
  const t = await getTranslations("common");
  return (
    <a
      href={whatsappLink(phone, message)}
      target="_blank"
      rel="noopener noreferrer"
      aria-label={t("chatOnWhatsapp")}
      data-testid="whatsapp-float"
      className="group fixed bottom-5 end-5 z-40 flex items-center gap-2 rounded-full bg-whatsapp p-3.5 text-white shadow-[0_10px_30px_-8px_rgb(37_211_102/0.7)] transition-transform hover:scale-105 sm:bottom-7 sm:end-7"
    >
      <SocialIcons.whatsapp className="h-7 w-7" />
      <span className="hidden max-w-0 overflow-hidden whitespace-nowrap text-sm font-medium transition-all duration-300 group-hover:max-w-48 sm:inline">
        {t("chatOnWhatsapp")}
      </span>
    </a>
  );
}
