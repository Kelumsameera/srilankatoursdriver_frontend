import {
  Activity,
  BookOpen,
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
  Settings,
  Users,
  Wand2,
  type LucideIcon,
} from "lucide-react";

export interface NavLink {
  label: string;
  href: string;
  /** Permission needed to see the link (UI only – the API enforces it). */
  perm?: string;
}
export interface NavGroup {
  label: string;
  icon: LucideIcon;
  href?: string;
  perm?: string;
  children?: NavLink[];
}

const statusLinks = (base: string, statuses: string[], perm: string) =>
  statuses.map((s) => ({ label: s.charAt(0).toUpperCase() + s.slice(1), href: `${base}?status=${s}`, perm }));

export const ADMIN_NAV: NavGroup[] = [
  { label: "Dashboard", icon: LayoutDashboard, href: "/admin", perm: "dashboard:read" },
  {
    label: "Website",
    icon: Globe2,
    children: [
      { label: "Site Settings", href: "/admin/settings", perm: "settings:read" },
      { label: "Branding", href: "/admin/branding", perm: "branding:read" },
      { label: "Homepage", href: "/admin/pages/home", perm: "pages:read" },
      { label: "Navbar", href: "/admin/content/navigation", perm: "navigation:read" },
      { label: "Footer", href: "/admin/footer", perm: "settings:read" },
      { label: "Pages", href: "/admin/pages", perm: "pages:read" },
      { label: "SEO", href: "/admin/content/seo", perm: "seo:read" },
      { label: "Social Media", href: "/admin/social", perm: "settings:read" },
    ],
  },
  {
    label: "Media",
    icon: ImageIcon,
    children: [
      { label: "Media Library", href: "/admin/media", perm: "media:read" },
      { label: "Hero Media", href: "/admin/content/hero", perm: "hero:read" },
      { label: "Gallery", href: "/admin/content/gallery", perm: "gallery:read" },
    ],
  },
  {
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
    label: "Destinations",
    icon: MapPin,
    children: [
      { label: "All Destinations", href: "/admin/content/destinations", perm: "destinations:read" },
      { label: "Categories", href: "/admin/content/destination-categories", perm: "categories:read" },
    ],
  },
  {
    label: "Excursions",
    icon: Compass,
    children: [
      { label: "All Excursions", href: "/admin/content/excursions", perm: "excursions:read" },
      { label: "Categories", href: "/admin/content/excursion-categories", perm: "categories:read" },
    ],
  },
  {
    label: "Vehicles",
    icon: Car,
    children: [
      { label: "Vehicles", href: "/admin/content/vehicles", perm: "vehicles:read" },
      { label: "Categories", href: "/admin/content/vehicle-categories", perm: "categories:read" },
    ],
  },
  {
    label: "Bookings",
    icon: CalendarCheck,
    children: [
      { label: "All Bookings", href: "/admin/bookings", perm: "bookings:read" },
      ...statusLinks("/admin/bookings", ["new", "contacted", "quoted", "confirmed", "cancelled", "completed"], "bookings:read"),
    ],
  },
  {
    label: "Tailor-Made Tours",
    icon: Wand2,
    children: [
      { label: "Enquiries", href: "/admin/tailor-made", perm: "enquiries:read" },
      ...statusLinks("/admin/tailor-made", ["new", "processing", "quoted", "confirmed", "closed"], "enquiries:read"),
    ],
  },
  {
    label: "Content",
    icon: BookOpen,
    children: [
      { label: "Blog", href: "/admin/content/blog", perm: "blog:read" },
      { label: "Categories", href: "/admin/content/blog-categories", perm: "categories:read" },
      { label: "Guest Shorts", href: "/admin/content/guest-shorts", perm: "guestShorts:read" },
      { label: "Reviews", href: "/admin/content/reviews", perm: "reviews:read" },
      { label: "FAQs", href: "/admin/content/faqs", perm: "faqs:read" },
      { label: "Testimonials", href: "/admin/content/testimonials", perm: "reviews:read" },
      { label: "Gallery Categories", href: "/admin/content/gallery-categories", perm: "categories:read" },
    ],
  },
  { label: "Contact Messages", icon: MessageSquare, href: "/admin/messages", perm: "contacts:read" },
  {
    label: "Translations",
    icon: FileText,
    children: [
      { label: "Languages", href: "/admin/translations/languages", perm: "translations:read" },
      { label: "Translation Status", href: "/admin/translations", perm: "translations:read" },
      { label: "Content Translation", href: "/admin/translations/editor", perm: "translations:read" },
    ],
  },
  {
    label: "Users",
    icon: Users,
    children: [
      { label: "Admin Users", href: "/admin/users", perm: "users:read" },
      { label: "Roles", href: "/admin/roles", perm: "roles:read" },
      { label: "Permissions", href: "/admin/permissions", perm: "roles:read" },
    ],
  },
  {
    label: "System",
    icon: Settings,
    children: [
      { label: "Activity Logs", href: "/admin/activity", perm: "activityLogs:read" },
      { label: "API Settings", href: "/admin/system/api", perm: "system:read" },
      { label: "Security", href: "/admin/system/security" },
    ],
  },
];

export const ACTIVITY_ICON = Activity;
