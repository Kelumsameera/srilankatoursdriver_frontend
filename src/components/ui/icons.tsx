import type { SVGProps } from "react";
import {
  Car,
  Clock,
  Compass,
  Gem,
  Heart,
  Leaf,
  Map,
  Mountain,
  Shield,
  Star,
  Sun,
  Users,
  Waves,
  Camera,
  Award,
  Globe,
  type LucideIcon,
} from "lucide-react";

/** Icons the admin can choose for "Why choose us" / feature items. */
export const FEATURE_ICONS: Record<string, LucideIcon> = {
  car: Car,
  clock: Clock,
  compass: Compass,
  map: Map,
  shield: Shield,
  star: Star,
  heart: Heart,
  leaf: Leaf,
  mountain: Mountain,
  sun: Sun,
  users: Users,
  waves: Waves,
  camera: Camera,
  award: Award,
  globe: Globe,
  gem: Gem,
};

export function FeatureIcon({ name, className }: { name?: string; className?: string }) {
  const Icon = FEATURE_ICONS[name ?? ""] ?? Compass;
  return <Icon className={className} strokeWidth={1.5} aria-hidden />;
}

type P = SVGProps<SVGSVGElement>;
const svg = (path: string) =>
  function SocialIcon(props: P) {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" aria-hidden {...props}>
        <path d={path} />
      </svg>
    );
  };

/** Brand glyphs (lucide no longer ships brand icons). */
export const SocialIcons = {
  facebook: svg("M14 8h3V4h-3c-2.8 0-5 2.2-5 5v2H7v4h2v7h4v-7h3l1-4h-4V9c0-.6.4-1 1-1z"),
  instagram: svg(
    "M12 7a5 5 0 1 0 0 10 5 5 0 0 0 0-10zm0 8.2a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4zM17.3 5.5a1.2 1.2 0 1 0 0 2.4 1.2 1.2 0 0 0 0-2.4zM12 2c-2.7 0-3.1 0-4.1.1C4.7 2.2 2.2 4.6 2.1 7.9 2 8.9 2 9.3 2 12s0 3.1.1 4.1c.1 3.3 2.6 5.7 5.8 5.8 1 .1 1.4.1 4.1.1s3.1 0 4.1-.1c3.2-.1 5.7-2.6 5.8-5.8.1-1 .1-1.4.1-4.1s0-3.1-.1-4.1c-.1-3.2-2.6-5.7-5.8-5.8C15.1 2 14.7 2 12 2zm0 1.8c2.7 0 3 0 4 .1 2.3.1 3.9 1.7 4 4 .1 1 .1 1.3.1 4s0 3-.1 4c-.1 2.3-1.7 3.9-4 4-1 .1-1.3.1-4 .1s-3 0-4-.1c-2.3-.1-3.9-1.7-4-4-.1-1-.1-1.3-.1-4s0-3 .1-4c.1-2.3 1.7-3.9 4-4 1-.1 1.3-.1 4-.1z",
  ),
  youtube: svg(
    "M23 7.2a3 3 0 0 0-2.1-2.1C19 4.6 12 4.6 12 4.6s-7 0-8.9.5A3 3 0 0 0 1 7.2 31 31 0 0 0 .5 12 31 31 0 0 0 1 16.8a3 3 0 0 0 2.1 2.1c1.9.5 8.9.5 8.9.5s7 0 8.9-.5a3 3 0 0 0 2.1-2.1 31 31 0 0 0 .5-4.8 31 31 0 0 0-.5-4.8zM9.7 15V9l5.8 3-5.8 3z",
  ),
  tiktok: svg("M19 8.3a6.5 6.5 0 0 1-3.8-1.2v6.4a5.8 5.8 0 1 1-5-5.8v3.2a2.7 2.7 0 1 0 1.9 2.6V2h3.1a3.8 3.8 0 0 0 3.8 3.4v2.9z"),
  tripadvisor: svg(
    "M12 6.3c-2.4 0-4.8.6-6.7 1.9H1.5l1.6 1.8a4.8 4.8 0 1 0 6.5 7l2.4 2.6 2.4-2.6a4.8 4.8 0 1 0 6.5-7l1.6-1.8h-3.8A12 12 0 0 0 12 6.3zM7.2 17.1a3 3 0 1 1 0-6 3 3 0 0 1 0 6zm9.6 0a3 3 0 1 1 0-6 3 3 0 0 1 0 6zM12 8.1c1.4 0 2.8.3 4 .8a4.8 4.8 0 0 0-4 4.7 4.8 4.8 0 0 0-4-4.7c1.2-.5 2.6-.8 4-.8zM7.2 12.7a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8zm9.6 0a1.4 1.4 0 1 0 0 2.8 1.4 1.4 0 0 0 0-2.8z",
  ),
  twitter: svg("M17.8 3h3.1l-6.8 7.7L22 21h-6.2l-4.9-6.4L5.3 21H2.2l7.3-8.3L2 3h6.4l4.4 5.8L17.8 3zm-1.1 16.2h1.7L7.4 4.7H5.6l11.1 14.5z"),
  linkedin: svg(
    "M4.98 3.5a2.5 2.5 0 1 1 0 5 2.5 2.5 0 0 1 0-5zM3 9.75h4v11H3v-11zm7 0h3.8v1.5h.1c.5-1 1.8-2 3.7-2 4 0 4.7 2.6 4.7 6v5.5h-4v-4.9c0-1.2 0-2.7-1.6-2.7s-1.9 1.3-1.9 2.6v5h-4v-11z",
  ),
  pinterest: svg(
    "M12 2a10 10 0 0 0-3.6 19.3c-.1-.8-.2-2 0-2.9l1.3-5.5s-.3-.7-.3-1.6c0-1.5.9-2.7 2-2.7.9 0 1.4.7 1.4 1.5 0 .9-.6 2.3-.9 3.6-.3 1.1.5 2 1.6 2 1.9 0 3.4-2 3.4-5 0-2.6-1.9-4.4-4.5-4.4-3.1 0-4.9 2.3-4.9 4.7 0 .9.4 1.9.8 2.5.1.1.1.2.1.3l-.3 1.2c0 .2-.2.3-.4.2-1.4-.6-2.2-2.6-2.2-4.2 0-3.4 2.5-6.6 7.2-6.6 3.8 0 6.7 2.7 6.7 6.3 0 3.8-2.4 6.8-5.7 6.8-1.1 0-2.2-.6-2.5-1.3l-.7 2.6c-.2 1-.9 2.2-1.4 2.9A10 10 0 1 0 12 2z",
  ),
  whatsapp: svg(
    "M12 2a10 10 0 0 0-8.6 15.1L2 22l5-1.3A10 10 0 1 0 12 2zm0 18.2c-1.5 0-3-.4-4.3-1.2l-.3-.2-3 .8.8-2.9-.2-.3A8.2 8.2 0 1 1 12 20.2zm4.5-6.1c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.1.2-.3.2-.5.1a6.7 6.7 0 0 1-3.3-2.9c-.3-.4.3-.4.7-1.3.1-.2 0-.3 0-.4l-.8-1.8c-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.6.3-.2.2-.8.8-.8 2s.9 2.3 1 2.5c.1.2 1.7 2.7 4.2 3.7 1.6.7 2.2.7 3 .6.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2l-.5-.3z",
  ),
};
