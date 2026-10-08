/** Shapes returned by the Express REST API. */

export interface MediaAsset {
  mediaId?: string | null;
  publicId?: string;
  url?: string;
  resourceType?: "image" | "video";
  format?: string;
  width?: number | null;
  height?: number | null;
  duration?: number | null;
  alt?: string;
}

export interface Seo {
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: MediaAsset | null;
  robots?: string;
}

export interface LinkButton {
  label?: string;
  url?: string;
  variant?: "primary" | "secondary" | "outline" | "whatsapp" | "link";
  openInNewTab?: boolean;
}

export interface FooterColumn {
  title: string;
  enabled?: boolean;
  links: { label: string; url: string }[];
}

export interface TransferRate {
  destination: string;
  car?: number | null;
  van?: number | null;
  bus?: number | null;
  duration?: string;
  distanceKm?: number | null;
}

export interface SiteSettings {
  siteName: string;
  businessName: string;
  tagline?: string;
  address?: string;
  googleMapsUrl?: string;
  mapEmbedUrl?: string;
  phone?: string;
  whatsapp?: string;
  whatsappMessage?: string;
  email?: string;
  businessHours?: string;
  websiteUrl?: string;
  timezone?: string;
  currency?: string;
  defaultLanguage?: string;
  social?: Partial<Record<"facebook" | "instagram" | "youtube" | "tiktok" | "tripadvisor" | "twitter" | "linkedin" | "pinterest", string>>;
  footer?: {
    description?: string;
    columns?: FooterColumn[];
    showTourLinks?: boolean;
    showDestinationLinks?: boolean;
    showSocial?: boolean;
    copyright?: string;
    privacyUrl?: string;
    termsUrl?: string;
    cookieUrl?: string;
  };
  tripadvisor?: { enabled?: boolean; profileUrl?: string; ratingText?: string };
  /** Fixed airport-transfer price table shown on destination pages. */
  transferRates?: {
    enabled?: boolean;
    title?: string;
    subtitle?: string;
    currency?: string;
    note?: string;
    rows?: TransferRate[];
  };
  /** Accreditation / partner logos for the trust bar. */
  partners?: { name: string; url?: string; logo?: MediaAsset | null }[];
  maintenanceMode?: boolean;
  updatedAt?: string;
}

export interface Branding {
  primaryLogo?: MediaAsset | null;
  lightLogo?: MediaAsset | null;
  darkLogo?: MediaAsset | null;
  mobileLogo?: MediaAsset | null;
  favicon?: MediaAsset | null;
  logoAlt?: string;
  logoWidth?: number;
  logoHeight?: number;
  colors?: { primary?: string; secondary?: string; accent?: string };
}

export interface NavItem {
  _id: string;
  label: string;
  url?: string;
  openInNewTab?: boolean;
  isCta?: boolean;
  children?: NavItem[];
}

export interface Language {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  rtl?: boolean;
}

export interface Category {
  _id: string;
  kind: string;
  name: string;
  slug: string;
  description?: string;
  icon?: string;
  image?: MediaAsset | null;
}

export interface TourDay {
  _id?: string;
  day: number;
  title: string;
  description?: string;
  location?: string;
  overnight?: string;
  distanceKm?: number | null;
  travelTime?: string;
  meals?: string[];
  activities?: string[];
  image?: MediaAsset | null;
}

export interface Destination {
  _id: string;
  name: string;
  slug: string;
  region?: string;
  shortDescription?: string;
  description?: string;
  heroMedia?: MediaAsset | null;
  gallery?: MediaAsset[];
  highlights?: string[];
  thingsToDo?: string[];
  bestTimeToVisit?: string;
  location?: { lat?: number | null; lng?: number | null };
  category?: Category | null;
  featured?: boolean;
  seo?: Seo;
  updatedAt?: string;
}

export interface Vehicle {
  _id: string;
  name: string;
  slug: string;
  type?: string;
  description?: string;
  images?: MediaAsset[];
  seats?: number;
  luggageCapacity?: number;
  airConditioning?: boolean;
  features?: string[];
  dailyRate?: number | null;
  currency?: string;
  availability?: "available" | "limited" | "unavailable";
  category?: Category | null;
  featured?: boolean;
  seo?: Seo;
}

export interface Tour {
  _id: string;
  title: string;
  slug: string;
  shortDescription?: string;
  description?: string;
  heroMedia?: MediaAsset | null;
  gallery?: MediaAsset[];
  durationDays?: number;
  durationNights?: number;
  price?: number | null;
  currency?: string;
  priceNote?: string;
  startLocation?: string;
  endLocation?: string;
  destinations?: Destination[];
  category?: Category | null;
  tourType?: string;
  difficulty?: "easy" | "moderate" | "challenging";
  groupSize?: string;
  highlights?: string[];
  included?: string[];
  excluded?: string[];
  hotels?: { name: string; location?: string; nights?: number; category?: string; url?: string }[];
  vehicle?: Vehicle | null;
  driver?: { included?: boolean; name?: string; languages?: string[]; description?: string };
  itinerary?: TourDay[];
  faqs?: { question: string; answer: string }[];
  featured?: boolean;
  seo?: Seo;
  updatedAt?: string;
}

export interface Excursion {
  _id: string;
  title: string;
  slug: string;
  category?: Category | null;
  destination?: Pick<Destination, "_id" | "name" | "slug"> | null;
  location?: string;
  duration?: string;
  price?: number | null;
  currency?: string;
  priceNote?: string;
  shortDescription?: string;
  description?: string;
  heroMedia?: MediaAsset | null;
  gallery?: MediaAsset[];
  highlights?: string[];
  included?: string[];
  featured?: boolean;
  seo?: Seo;
}

export interface GalleryItem {
  _id: string;
  media: MediaAsset;
  title?: string;
  caption?: string;
  altText?: string;
  category?: Category | null;
  tags?: string[];
  featured?: boolean;
}

export interface BlogPost {
  _id: string;
  title: string;
  slug: string;
  excerpt?: string;
  content?: string;
  coverImage?: MediaAsset | null;
  author?: string;
  category?: Category | null;
  tags?: string[];
  publishDate?: string;
  readingMinutes?: number;
  featured?: boolean;
  seo?: Seo;
  updatedAt?: string;
}

export interface GuestShort {
  _id: string;
  title: string;
  guestName?: string;
  country?: string;
  platform: "youtube" | "instagram" | "tiktok" | "upload";
  videoUrl?: string;
  uploadedMedia?: MediaAsset | null;
  thumbnail?: MediaAsset | null;
  description?: string;
  date?: string;
}

export interface Review {
  _id: string;
  guestName: string;
  country?: string;
  rating: number;
  title?: string;
  review: string;
  date?: string;
  photo?: MediaAsset | null;
  platform?: string;
  sourceUrl?: string;
  verified?: boolean;
  featured?: boolean;
  tour?: { title: string; slug: string } | null;
}

export interface Faq {
  _id: string;
  question: string;
  answer: string;
  category?: string;
}

export interface HeroSlide {
  _id: string;
  title: string;
  subtitle?: string;
  description?: string;
  desktopImage?: MediaAsset | null;
  mobileImage?: MediaAsset | null;
  video?: MediaAsset | null;
  button1?: LinkButton;
  button2?: LinkButton;
  overlay?: boolean;
  overlayColor?: string;
  overlayOpacity?: number;
  textAlign?: "left" | "center";
}

export interface TripAdvisorSummary {
  configured: boolean;
  name?: string;
  rating?: number;
  numReviews?: number;
  ratingImageUrl?: string;
  webUrl?: string;
  reviews: { id: string; title: string; text: string; rating: number; publishedDate: string; url: string; user: { username: string; country?: string } }[];
}

export type SectionType =
  | "hero"
  | "whyChooseUs"
  | "popularTours"
  | "destinations"
  | "excursions"
  | "vehicles"
  | "tailorMade"
  | "gallery"
  | "guestShorts"
  | "reviews"
  | "tripadvisor"
  | "blog"
  | "faqs"
  | "richText"
  | "features"
  | "cta"
  | "contact"
  | "offer"
  | "team";

export interface PageSection {
  _id: string;
  type: SectionType;
  name?: string;
  eyebrow?: string;
  title?: string;
  subtitle?: string;
  /** Highlighted short line: a season ("November to April") or an offer badge. */
  badge?: string;
  /** Offer sections only. */
  price?: string;
  priceNote?: string;
  content?: string;
  /** `role` is used by team sections (title = person's name). */
  items?: { title?: string; role?: string; description?: string; icon?: string; image?: MediaAsset | null; url?: string }[];
  buttons?: LinkButton[];
  media?: MediaAsset | null;
  settings?: { limit?: number; source?: "featured" | "latest" | "all"; theme?: "light" | "sand" | "forest" | "dark"; layout?: string; category?: string | null };
  enabled?: boolean;
  order?: number;
  data?: unknown;
}

export interface CmsPage {
  _id: string;
  slug: string;
  title: string;
  subtitle?: string;
  heroImage?: MediaAsset | null;
  content?: string;
  seo?: Seo;
  isSystem?: boolean;
  updatedAt?: string;
}

export interface PageResponse {
  page: CmsPage;
  sections: PageSection[];
}

export interface SeoMetadata {
  key: string;
  titleTemplate?: string;
  seoTitle?: string;
  metaDescription?: string;
  keywords?: string[];
  canonicalUrl?: string;
  ogTitle?: string;
  ogDescription?: string;
  ogImage?: MediaAsset | null;
  twitterHandle?: string;
  robots?: string;
  googleSiteVerification?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiEnvelope<T> {
  success: boolean;
  message: string;
  data: T;
  meta?: PaginationMeta;
  errors?: { path: string; message: string }[];
  code?: string;
}
