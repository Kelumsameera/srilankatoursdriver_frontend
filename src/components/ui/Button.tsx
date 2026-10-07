import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { CmsLink } from "./CmsLink";

export type ButtonVariant = "primary" | "secondary" | "outline" | "whatsapp" | "link" | "ghost-light" | "outline-light";

const base =
  "inline-flex items-center justify-center gap-2 rounded-full font-medium transition-all duration-300 disabled:cursor-not-allowed disabled:opacity-60 whitespace-nowrap";
const sizes = { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-sm", lg: "px-7 py-3.5 text-base" };
const variants: Record<ButtonVariant, string> = {
  primary: "bg-gold-500 text-forest-950 hover:bg-gold-400 shadow-[0_8px_24px_-10px_rgb(201_154_59/0.8)]",
  secondary: "bg-forest-800 text-white hover:bg-forest-700",
  outline: "border border-forest-800/25 text-forest-800 hover:border-forest-800 hover:bg-forest-800 hover:text-white",
  whatsapp: "bg-whatsapp text-white hover:brightness-95",
  link: "text-forest-700 underline-offset-4 hover:underline px-0 py-0",
  "ghost-light": "bg-white/10 text-white backdrop-blur hover:bg-white/20",
  "outline-light": "border border-white/50 text-white hover:bg-white hover:text-forest-900",
};

export function buttonClass(variant: ButtonVariant = "primary", size: keyof typeof sizes = "md", className?: string) {
  return cn(base, variant !== "link" && sizes[size], variants[variant], className);
}

interface ButtonLinkProps {
  href?: string;
  variant?: ButtonVariant;
  size?: keyof typeof sizes;
  className?: string;
  children: ReactNode;
  newTab?: boolean;
  whatsapp?: { phone?: string; message?: string };
}

export function ButtonLink({ href, variant = "primary", size = "md", className, children, newTab, whatsapp }: ButtonLinkProps) {
  return (
    <CmsLink href={href} className={buttonClass(variant, size, className)} newTab={newTab} whatsapp={whatsapp}>
      {children}
    </CmsLink>
  );
}
