import {
  BarChart3,
  BookOpen,
  Bot,
  CalendarCheck,
  Car,
  Compass,
  FileText,
  Globe2,
  Image as ImageIcon,
  LayoutDashboard,
  Map,
  MapPin,
  MessageSquare,
  PanelsTopLeft,
  Settings,
  Star,
  UserRound,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import { RESOURCES } from "./resources";

export interface NavLink {
  label: string;
  href: string;
  /** Permission needed to see the link (UI only – the API enforces it). */
  perm?: string;
}
export interface NavGroup {
  /** Sidebar heading this group sits under. */
  section: string;
  label: string;
  icon: LucideIcon;
  href?: string;
  perm?: string;
  children?: NavLink[];
}

// Sidebar sections, top to bottom: daily work first, then content, then website settings
export const ADMIN_NAV: NavGroup[] = [
  // OVERVIEW
  { section: "Overview", label: "Dashboard", icon: LayoutDashboard, href: "/admin", perm: "dashboard:read" },
  { section: "Overview", label: "Analytics", icon: BarChart3, href: "/admin/analytics", perm: "analytics:read" },

  // BOOKINGS & ENQUIRIES (the status tabs are on each list page)
  { section: "Bookings & Enquiries", label: "Bookings", icon: CalendarCheck, href: "/admin/bookings", perm: "bookings:read" },
  { section: "Bookings & Enquiries", label: "Tailor-Made Enquiries", icon: Wand2, href: "/admin/tailor-made", perm: "enquiries:read" },
  { section: "Bookings & Enquiries", label: "Contact Messages", icon: MessageSquare, href: "/admin/messages", perm: "contacts:read" },
  { section: "Bookings & Enquiries", label: "Customers", icon: UserRound, href: "/admin/customers", perm: "customers:read" },
  { section: "Bookings & Enquiries", label: "AI Chats", icon: Bot, href: "/admin/chats", perm: "bookings:read" },

  // CONTENT
  {
    section: "Content",
    label: "Tours",
    icon: Map,
    children: [
      { label: "All Tours", href: "/admin/content/tours", perm: "tours:read" },
      { label: "Add Tour", href: "/admin/content/tours/new", perm: "tours:create" },
      { label: "Categories", href: "/admin/content/tour-categories", perm: "categories:read" },
      { label: "Itineraries", href: "/admin/itineraries", perm: "tours:read" },
    ],
  },
  {
    section: "Content",
    label: "Destinations",
    icon: MapPin,
    children: [
      { label: "All Destinations", href: "/admin/content/destinations", perm: "destinations:read" },
      { label: "Categories", href: "/admin/content/destination-categories", perm: "categories:read" },
    ],
  },
  {
    section: "Content",
    label: "Excursions",
    icon: Compass,
    children: [
      { label: "All Excursions", href: "/admin/content/excursions", perm: "excursions:read" },
      { label: "Categories", href: "/admin/content/excursion-categories", perm: "categories:read" },
    ],
  },
  {
    section: "Content",
    label: "Vehicles",
    icon: Car,
    children: [
      { label: "Vehicles", href: "/admin/content/vehicles", perm: "vehicles:read" },
      { label: "Categories", href: "/admin/content/vehicle-categories", perm: "categories:read" },
    ],
  },
  {
    section: "Content",
    label: "Blog & Community",
    icon: BookOpen,
    children: [
      { label: "Blog", href: "/admin/content/blog", perm: "blog:read" },
      { label: "Comments", href: "/admin/content/comments", perm: "blog:read" },
      { label: "Guest Stories", href: "/admin/content/stories", perm: "blog:read" },
      { label: "Categories", href: "/admin/content/blog-categories", perm: "categories:read" },
      { label: "Guest Shorts", href: "/admin/content/guest-shorts", perm: "guestShorts:read" },
    ],
  },
  {
    section: "Content",
    label: "Reviews & FAQs",
    icon: Star,
    children: [
      { label: "Reviews", href: "/admin/content/reviews", perm: "reviews:read" },
      { label: "Testimonials", href: "/admin/content/testimonials", perm: "reviews:read" },
      { label: "FAQs", href: "/admin/content/faqs", perm: "faqs:read" },
      { label: "AI Knowledge", href: "/admin/content/chat-knowledge", perm: "faqs:read" },
    ],
  },
  {
    section: "Content",
    label: "Media",
    icon: ImageIcon,
    children: [
      { label: "Media Library", href: "/admin/media", perm: "media:read" },
      { label: "Hero Media", href: "/admin/content/hero", perm: "hero:read" },
      { label: "Gallery", href: "/admin/content/gallery", perm: "gallery:read" },
      { label: "Gallery Categories", href: "/admin/content/gallery-categories", perm: "categories:read" },
    ],
  },

  // WEBSITE: pages and menus, then settings and look
  {
    section: "Website",
    label: "Pages & Menus",
    icon: PanelsTopLeft,
    children: [
      { label: "Homepage", href: "/admin/pages/home", perm: "pages:read" },
      { label: "Pages", href: "/admin/pages", perm: "pages:read" },
      { label: "Navbar", href: "/admin/content/navigation", perm: "navigation:read" },
      { label: "Footer", href: "/admin/footer", perm: "settings:read" },
      { label: "SEO", href: "/admin/content/seo", perm: "seo:read" },
    ],
  },
  {
    section: "Website",
    label: "Site Settings",
    icon: Globe2,
    children: [
      { label: "General Settings", href: "/admin/settings", perm: "settings:read" },
      { label: "Branding", href: "/admin/branding", perm: "branding:read" },
      { label: "Theme", href: "/admin/theme", perm: "branding:read" },
      { label: "Transfer Rates", href: "/admin/rates", perm: "settings:read" },
      { label: "Social Media", href: "/admin/social", perm: "settings:read" },
    ],
  },
  {
    section: "Website",
    label: "Translations",
    icon: FileText,
    children: [
      { label: "Languages", href: "/admin/translations/languages", perm: "translations:read" },
      { label: "Translation Status", href: "/admin/translations", perm: "translations:read" },
      { label: "Content Translation", href: "/admin/translations/editor", perm: "translations:read" },
      { label: "UI Texts", href: "/admin/translations/ui-texts", perm: "translations:read" },
    ],
  },

  // ADMIN
  {
    section: "Admin",
    label: "Users",
    icon: Users,
    children: [
      { label: "Admin Users", href: "/admin/users", perm: "users:read" },
      { label: "Roles", href: "/admin/roles", perm: "roles:read" },
      { label: "Permissions", href: "/admin/permissions", perm: "roles:read" },
    ],
  },
  {
    section: "Admin",
    label: "System",
    icon: Settings,
    children: [
      { label: "Activity Logs", href: "/admin/activity", perm: "activityLogs:read" },
      { label: "API Settings", href: "/admin/system/api", perm: "system:read" },
      { label: "Security", href: "/admin/system/security" },
    ],
  },
];

const NAV_PERMS = ADMIN_NAV.flatMap((g) => [...(g.href ? [{ href: g.href, perm: g.perm }] : []), ...(g.children ?? [])])
  .map((l) => ({ path: l.href.split("?")[0], perm: l.perm }))
  .filter((l): l is { path: string; perm: string } => !!l.perm && l.path !== "/admin");

/**
 * Permission needed to open an admin route (UI guard only – the API still enforces every request).
 * Content routes use their resource config; other pages use the most specific sidebar link.
 */
export function routePermission(pathname: string): string | null {
  const content = pathname.match(/^\/admin\/content\/([^/]+)(?:\/([^/]+))?/);
  if (content) {
    const res = RESOURCES[content[1]];
    return res ? `${res.permission}:${content[2] === "new" ? "create" : "read"}` : null;
  }
  const match = NAV_PERMS.filter((l) => pathname === l.path || pathname.startsWith(`${l.path}/`)).sort((a, b) => b.path.length - a.path.length)[0];
  return match ? match.perm.replace(/:create$/, ":read") : null;
}
