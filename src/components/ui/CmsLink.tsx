import type { ReactNode } from "react";
import { Link } from "@/i18n/navigation";
import { isExternal, whatsappLink } from "@/lib/utils";

interface Props {
  href?: string;
  children: ReactNode;
  className?: string;
  newTab?: boolean;
  /** Needed for the special "whatsapp" URL value used by CMS buttons. */
  whatsapp?: { phone?: string; message?: string };
  ariaLabel?: string;
}

/**
 * Renders CMS-provided links. Internal paths ("/tours") get the current locale prefix;
 * external URLs open normally; the special value "whatsapp" opens a WhatsApp chat
 * with the number from Site Settings.
 */
export function CmsLink({ href, children, className, newTab, whatsapp, ariaLabel }: Props) {
  const url = href?.trim() || "/";
  if (url === "whatsapp") {
    return (
      <a href={whatsappLink(whatsapp?.phone, whatsapp?.message)} target="_blank" rel="noopener noreferrer" className={className} aria-label={ariaLabel}>
        {children}
      </a>
    );
  }
  if (isExternal(url) || url.startsWith("#")) {
    const external = /^https?:/i.test(url);
    return (
      <a
        href={url}
        className={className}
        aria-label={ariaLabel}
        {...(newTab || external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      >
        {children}
      </a>
    );
  }
  return (
    <Link href={url} className={className} aria-label={ariaLabel} {...(newTab ? { target: "_blank" } : {})}>
      {children}
    </Link>
  );
}
