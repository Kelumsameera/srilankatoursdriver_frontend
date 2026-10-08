import type { FieldDef, FormSection } from "@/components/admin/form/types";
import type { MediaFolder } from "@/lib/admin/upload";

export interface Column {
  key: string;
  label: string;
  kind?: "text" | "image" | "status" | "bool" | "date" | "number" | "price" | "category" | "stars" | "count";
}

export interface AdminResource {
  key: string;
  title: string;
  singular: string;
  description?: string;
  endpoint: string;
  /** Permission module, e.g. "tours" → tours:create / read / update / delete. */
  permission: string;
  fixedQuery?: Record<string, string>;
  fixedValues?: Record<string, unknown>;
  columns: Column[];
  titleKey: string;
  imageKey?: string;
  statusField?: "status" | "enabled";
  statusOptions?: string[];
  filters?: { key: string; label: string; options: { value: string; label: string }[] }[];
  reorderable?: boolean;
  duplicable?: boolean;
  featurable?: boolean;
  sections: FormSection[];
  defaults?: Record<string, unknown>;
  publicPath?: (item: Record<string, unknown>) => string | null;
  translationType?: string;
}

const opt = (...values: string[]) => values.map((v) => ({ value: v, label: v.charAt(0).toUpperCase() + v.slice(1) }));
const STATUS = opt("draft", "published", "archived");

const seo: FieldDef = {
  name: "seo",
  label: "SEO",
  type: "group",
  hint: "Leave empty to use the title / description automatically.",
  fields: [
    { name: "seoTitle", label: "SEO title", type: "text", hint: "≤ 60 chars" },
    { name: "canonicalUrl", label: "Canonical URL", type: "url" },
    { name: "metaDescription", label: "Meta description", type: "textarea", span: 2, hint: "≤ 160 chars" },
    { name: "keywords", label: "Keywords", type: "tags", span: 2 },
    { name: "ogTitle", label: "OpenGraph title", type: "text" },
    { name: "robots", label: "Robots", type: "select", options: [{ value: "index,follow", label: "index, follow" }, { value: "noindex,follow", label: "noindex, follow" }, { value: "noindex,nofollow", label: "noindex, nofollow" }] },
    { name: "ogDescription", label: "OpenGraph description", type: "textarea", span: 2 },
    { name: "ogImage", label: "OpenGraph image (1200×630)", type: "media", folder: "seo", span: 2 },
  ],
};

const publishing = (statusOptions = STATUS): FieldDef[] => [
  { name: "status", label: "Status", type: "select", options: statusOptions },
  { name: "order", label: "Order", type: "number", hint: "lower = first" },
  { name: "featured", label: "Featured", type: "switch", hint: "Show on the homepage / highlighted" },
];

const category = (kind: string): FieldDef => ({ name: "category", label: "Category", type: "relation", endpoint: "/admin/categories", labelKey: "name", query: { kind } });

const linkFields = (name: string, label: string): FieldDef => ({
  name,
  label,
  type: "group",
  fields: [
    { name: "label", label: "Label", type: "text" },
    { name: "url", label: "URL", type: "text", hint: "/tours, https://…, or 'whatsapp'" },
    { name: "variant", label: "Style", type: "select", options: opt("primary", "secondary", "outline", "whatsapp", "link") },
    { name: "openInNewTab", label: "New tab", type: "switch" },
  ],
});

const thumb = (key: string): Column => ({ key, label: "", kind: "image" });

/* ───────────── Category resources (one per content type) ───────────── */
function categoryResource(kind: string, title: string, folder: MediaFolder): AdminResource {
  return {
    key: `${kind}-categories`,
    title,
    singular: "Category",
    endpoint: "/admin/categories",
    permission: "categories",
    fixedQuery: { kind },
    fixedValues: { kind },
    titleKey: "name",
    statusField: "enabled",
    reorderable: true,
    columns: [
      { key: "name", label: "Name" },
      { key: "slug", label: "Slug" },
      { key: "order", label: "Order", kind: "number" },
      { key: "enabled", label: "Enabled", kind: "bool" },
    ],
    defaults: { enabled: true },
    translationType: "category",
    sections: [
      {
        title: "Category",
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "slug" },
          { name: "description", label: "Description", type: "textarea", span: 2 },
          { name: "icon", label: "Icon", type: "icon" },
          { name: "order", label: "Order", type: "number" },
          { name: "enabled", label: "Enabled", type: "switch" },
          { name: "image", label: "Image", type: "media", folder },
        ],
      },
    ],
  };
}

export const RESOURCES: Record<string, AdminResource> = {
  tours: {
    key: "tours",
    title: "Tours",
    singular: "Tour",
    endpoint: "/admin/tours",
    permission: "tours",
    titleKey: "title",
    imageKey: "heroMedia",
    statusField: "status",
    statusOptions: ["draft", "published", "archived"],
    reorderable: true,
    duplicable: true,
    featurable: true,
    translationType: "tour",
    publicPath: (i) => (i.status === "published" ? `/en/tours/${i.slug}` : null),
    columns: [thumb("heroMedia.url"), { key: "title", label: "Title" }, { key: "category", label: "Category", kind: "category" }, { key: "durationDays", label: "Days", kind: "number" }, { key: "price", label: "Price", kind: "price" }, { key: "status", label: "Status", kind: "status" }, { key: "featured", label: "Featured", kind: "bool" }],
    defaults: { status: "draft", currency: "USD", durationDays: 1, durationNights: 0, difficulty: "easy", driver: { included: true } },
    sections: [
      {
        title: "Basics",
        fields: [
          { name: "title", label: "Title", type: "text", required: true, span: 2 },
          { name: "slug", label: "Slug", type: "slug" },
          category("tour"),
          { name: "shortDescription", label: "Short description", type: "textarea", span: 2, hint: "Shown on cards" },
          { name: "description", label: "Full description", type: "markdown" },
          { name: "heroMedia", label: "Hero image", type: "media", folder: "tours", span: 2 },
          { name: "gallery", label: "Gallery", type: "mediaList", folder: "tours" },
        ],
      },
      {
        title: "Trip details",
        fields: [
          { name: "durationDays", label: "Days", type: "number", min: 1 },
          { name: "durationNights", label: "Nights", type: "number", min: 0 },
          { name: "price", label: "Price (from)", type: "number", min: 0, nullable: true, hint: "leave empty for 'price on request'" },
          { name: "currency", label: "Currency", type: "text" },
          { name: "priceNote", label: "Price note", type: "text", span: 2, placeholder: "per person sharing" },
          { name: "startLocation", label: "Start location", type: "text" },
          { name: "endLocation", label: "End location", type: "text" },
          { name: "tourType", label: "Tour type", type: "text" },
          { name: "difficulty", label: "Difficulty", type: "select", options: opt("easy", "moderate", "challenging") },
          { name: "groupSize", label: "Group size", type: "text" },
          { name: "vehicle", label: "Vehicle", type: "relation", endpoint: "/admin/vehicles", labelKey: "name" },
          { name: "destinations", label: "Destinations", type: "relation", endpoint: "/admin/destinations", labelKey: "name", multiple: true, span: 2 },
          { name: "highlights", label: "Highlights", type: "list" },
          { name: "included", label: "Included", type: "list" },
          { name: "excluded", label: "Excluded", type: "list" },
        ],
      },
      {
        title: "Itinerary",
        description: "Unlimited days – drag order with the arrows.",
        columns: 1,
        fields: [
          {
            name: "itinerary",
            label: "Days",
            type: "objectList",
            itemTitle: "title",
            addLabel: "Add day",
            fields: [
              { name: "day", label: "Day #", type: "number", min: 1, required: true },
              { name: "title", label: "Title", type: "text", required: true },
              { name: "location", label: "Location", type: "text" },
              { name: "overnight", label: "Overnight", type: "text" },
              { name: "travelTime", label: "Travel time", type: "text" },
              { name: "distanceKm", label: "Distance (km)", type: "number", nullable: true },
              { name: "description", label: "Description", type: "markdown" },
              { name: "activities", label: "Activities", type: "tags", span: 2 },
              { name: "meals", label: "Meals", type: "tags" },
              { name: "image", label: "Image", type: "media", folder: "tours" },
            ],
          },
        ],
      },
      {
        title: "Hotels, driver & FAQs",
        columns: 1,
        fields: [
          {
            name: "hotels",
            label: "Hotels",
            type: "objectList",
            itemTitle: "name",
            addLabel: "Add hotel",
            fields: [
              { name: "name", label: "Name", type: "text", required: true },
              { name: "location", label: "Location", type: "text" },
              { name: "nights", label: "Nights", type: "number" },
              { name: "category", label: "Category", type: "text" },
              { name: "url", label: "Website", type: "url", span: 2 },
            ],
          },
          {
            name: "driver",
            label: "Driver",
            type: "group",
            fields: [
              { name: "included", label: "Driver included", type: "switch" },
              { name: "name", label: "Name", type: "text" },
              { name: "languages", label: "Languages", type: "tags", span: 2 },
              { name: "description", label: "Description", type: "textarea", span: 2 },
            ],
          },
          {
            name: "faqs",
            label: "Tour FAQs",
            type: "objectList",
            itemTitle: "question",
            addLabel: "Add question",
            fields: [
              { name: "question", label: "Question", type: "text", required: true, span: 2 },
              { name: "answer", label: "Answer", type: "markdown", required: true },
            ],
          },
        ],
      },
      { title: "Publishing", fields: publishing() },
      { title: "SEO", columns: 1, fields: [seo] },
    ],
  },

  destinations: {
    key: "destinations",
    title: "Destinations",
    singular: "Destination",
    endpoint: "/admin/destinations",
    permission: "destinations",
    titleKey: "name",
    imageKey: "heroMedia",
    statusField: "status",
    statusOptions: ["draft", "published", "archived"],
    reorderable: true,
    duplicable: true,
    featurable: true,
    translationType: "destination",
    publicPath: (i) => (i.status === "published" ? `/en/destinations/${i.slug}` : null),
    columns: [thumb("heroMedia.url"), { key: "name", label: "Name" }, { key: "region", label: "Region" }, { key: "category", label: "Category", kind: "category" }, { key: "status", label: "Status", kind: "status" }, { key: "featured", label: "Featured", kind: "bool" }],
    defaults: { status: "draft" },
    sections: [
      {
        title: "Destination",
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "slug" },
          { name: "region", label: "Region", type: "text" },
          category("destination"),
          { name: "shortDescription", label: "Short description", type: "textarea", span: 2 },
          { name: "description", label: "Description", type: "markdown" },
          { name: "heroMedia", label: "Hero image", type: "media", folder: "destinations", span: 2 },
          { name: "gallery", label: "Gallery", type: "mediaList", folder: "destinations" },
          { name: "highlights", label: "Highlights", type: "list" },
          { name: "thingsToDo", label: "Things to do", type: "list" },
          { name: "bestTimeToVisit", label: "Best time to visit", type: "text", span: 2 },
          { name: "location", label: "Map location", type: "group", fields: [{ name: "lat", label: "Latitude", type: "number", nullable: true }, { name: "lng", label: "Longitude", type: "number", nullable: true }] },
        ],
      },
      { title: "Publishing", fields: publishing() },
      { title: "SEO", columns: 1, fields: [seo] },
    ],
  },

  excursions: {
    key: "excursions",
    title: "Excursions",
    singular: "Excursion",
    endpoint: "/admin/excursions",
    permission: "excursions",
    titleKey: "title",
    imageKey: "heroMedia",
    statusField: "status",
    statusOptions: ["draft", "published", "archived"],
    reorderable: true,
    duplicable: true,
    featurable: true,
    translationType: "excursion",
    publicPath: (i) => (i.status === "published" ? `/en/excursions/${i.slug}` : null),
    columns: [thumb("heroMedia.url"), { key: "title", label: "Title" }, { key: "category", label: "Category", kind: "category" }, { key: "duration", label: "Duration" }, { key: "price", label: "Price", kind: "price" }, { key: "status", label: "Status", kind: "status" }],
    defaults: { status: "draft", currency: "USD" },
    sections: [
      {
        title: "Excursion",
        fields: [
          { name: "title", label: "Title", type: "text", required: true, span: 2 },
          { name: "slug", label: "Slug", type: "slug" },
          category("excursion"),
          { name: "destination", label: "Destination", type: "relation", endpoint: "/admin/destinations", labelKey: "name" },
          { name: "location", label: "Location", type: "text" },
          { name: "duration", label: "Duration", type: "text", placeholder: "Half day" },
          { name: "price", label: "Price (from)", type: "number", min: 0, nullable: true },
          { name: "currency", label: "Currency", type: "text" },
          { name: "priceNote", label: "Price note", type: "text" },
          { name: "shortDescription", label: "Short description", type: "textarea", span: 2 },
          { name: "description", label: "Description", type: "markdown" },
          { name: "heroMedia", label: "Hero image", type: "media", folder: "excursions", span: 2 },
          { name: "gallery", label: "Gallery", type: "mediaList", folder: "excursions" },
          { name: "highlights", label: "Highlights", type: "list" },
          { name: "included", label: "Included", type: "list" },
        ],
      },
      { title: "Publishing", fields: publishing() },
      { title: "SEO", columns: 1, fields: [seo] },
    ],
  },

  vehicles: {
    key: "vehicles",
    title: "Vehicles",
    singular: "Vehicle",
    endpoint: "/admin/vehicles",
    permission: "vehicles",
    titleKey: "name",
    imageKey: "images.0",
    statusField: "status",
    statusOptions: ["draft", "published", "archived"],
    reorderable: true,
    duplicable: true,
    featurable: true,
    translationType: "vehicle",
    columns: [thumb("images.0.url"), { key: "name", label: "Name" }, { key: "type", label: "Type" }, { key: "seats", label: "Seats", kind: "number" }, { key: "dailyRate", label: "Daily rate", kind: "price" }, { key: "availability", label: "Availability", kind: "status" }, { key: "status", label: "Status", kind: "status" }],
    defaults: { status: "draft", currency: "USD", airConditioning: true, availability: "available", seats: 3, luggageCapacity: 2 },
    sections: [
      {
        title: "Vehicle",
        fields: [
          { name: "name", label: "Name", type: "text", required: true },
          { name: "slug", label: "Slug", type: "slug" },
          { name: "type", label: "Type", type: "text", placeholder: "Sedan / Van / SUV" },
          category("vehicle"),
          { name: "seats", label: "Seats", type: "number", min: 1 },
          { name: "luggageCapacity", label: "Luggage capacity", type: "number", min: 0 },
          { name: "airConditioning", label: "Air conditioning", type: "switch" },
          { name: "availability", label: "Availability", type: "select", options: opt("available", "limited", "unavailable") },
          { name: "dailyRate", label: "Daily rate", type: "number", min: 0, nullable: true },
          { name: "currency", label: "Currency", type: "text" },
          { name: "description", label: "Description", type: "markdown" },
          { name: "features", label: "Features", type: "list" },
          { name: "images", label: "Images", type: "mediaList", folder: "vehicles" },
        ],
      },
      { title: "Publishing", fields: publishing() },
    ],
  },

  hero: {
    key: "hero",
    title: "Hero Media",
    singular: "Hero slide",
    description: "Homepage hero slides – images, videos, text and buttons.",
    endpoint: "/admin/hero",
    permission: "hero",
    titleKey: "title",
    imageKey: "desktopImage",
    statusField: "enabled",
    reorderable: true,
    duplicable: true,
    translationType: "heroMedia",
    columns: [thumb("desktopImage.url"), { key: "title", label: "Title" }, { key: "order", label: "Order", kind: "number" }, { key: "startDate", label: "Starts", kind: "date" }, { key: "endDate", label: "Ends", kind: "date" }, { key: "enabled", label: "Enabled", kind: "bool" }],
    defaults: { enabled: true, overlay: true, overlayOpacity: 0.45, overlayColor: "#06261b", textAlign: "left", button1: { variant: "primary" }, button2: { variant: "outline" } },
    sections: [
      {
        title: "Content",
        fields: [
          { name: "title", label: "Title", type: "text", required: true, span: 2 },
          { name: "subtitle", label: "Subtitle (small text above title)", type: "text", span: 2 },
          { name: "description", label: "Description", type: "textarea", span: 2 },
          linkFields("button1", "Button 1"),
          linkFields("button2", "Button 2"),
        ],
      },
      {
        title: "Media",
        fields: [
          { name: "desktopImage", label: "Desktop image (1920×1080+)", type: "media", folder: "hero" },
          { name: "mobileImage", label: "Mobile image (portrait)", type: "media", folder: "hero" },
          { name: "video", label: "Background video (optional, overrides image)", type: "media", accept: "video", folder: "hero", span: 2 },
          { name: "overlay", label: "Dark overlay", type: "switch" },
          { name: "overlayOpacity", label: "Overlay opacity (0–1)", type: "number", min: 0, max: 1, step: 0.05 },
          { name: "overlayColor", label: "Overlay colour", type: "color" },
          { name: "textAlign", label: "Text alignment", type: "select", options: opt("left", "center") },
        ],
      },
      {
        title: "Scheduling",
        fields: [
          { name: "enabled", label: "Enabled", type: "switch" },
          { name: "featured", label: "Featured (shown first)", type: "switch" },
          { name: "order", label: "Order", type: "number" },
          { name: "startDate", label: "Start date", type: "date" },
          { name: "endDate", label: "End date", type: "date" },
        ],
      },
    ],
  },

  gallery: {
    key: "gallery",
    title: "Gallery",
    singular: "Gallery item",
    endpoint: "/admin/gallery",
    permission: "gallery",
    titleKey: "title",
    imageKey: "media",
    statusField: "status",
    statusOptions: ["draft", "published", "archived"],
    reorderable: true,
    featurable: true,
    translationType: "galleryItem",
    columns: [thumb("media.url"), { key: "title", label: "Title" }, { key: "media.resourceType", label: "Type" }, { key: "category", label: "Category", kind: "category" }, { key: "status", label: "Status", kind: "status" }, { key: "featured", label: "Featured", kind: "bool" }],
    defaults: { status: "published" },
    filters: [{ key: "resourceType", label: "Type", options: [{ value: "image", label: "Images" }, { value: "video", label: "Videos" }] }],
    sections: [
      {
        title: "Gallery item",
        fields: [
          { name: "media", label: "Image or video", type: "media", accept: "any", folder: "gallery", required: true, span: 2 },
          { name: "title", label: "Title", type: "text" },
          category("gallery"),
          { name: "altText", label: "Alt text", type: "text", span: 2 },
          { name: "caption", label: "Caption", type: "textarea", span: 2 },
          { name: "tags", label: "Tags", type: "tags", span: 2 },
        ],
      },
      { title: "Publishing", fields: publishing() },
    ],
  },

  blog: {
    key: "blog",
    title: "Blog",
    singular: "Post",
    endpoint: "/admin/blog",
    permission: "blog",
    titleKey: "title",
    imageKey: "coverImage",
    statusField: "status",
    statusOptions: ["draft", "published", "scheduled", "archived"],
    duplicable: true,
    featurable: true,
    translationType: "blogPost",
    publicPath: (i) => (i.status === "published" ? `/en/blog/${i.slug}` : null),
    columns: [thumb("coverImage.url"), { key: "title", label: "Title" }, { key: "category", label: "Category", kind: "category" }, { key: "publishDate", label: "Publish date", kind: "date" }, { key: "status", label: "Status", kind: "status" }],
    defaults: { status: "draft" },
    sections: [
      {
        title: "Post",
        fields: [
          { name: "title", label: "Title", type: "text", required: true, span: 2 },
          { name: "slug", label: "Slug", type: "slug" },
          category("blog"),
          { name: "excerpt", label: "Excerpt", type: "textarea", span: 2 },
          { name: "content", label: "Content", type: "markdown" },
          { name: "coverImage", label: "Cover image", type: "media", folder: "blog", span: 2 },
          { name: "author", label: "Author", type: "text" },
          { name: "tags", label: "Tags", type: "tags" },
        ],
      },
      {
        title: "Publishing",
        fields: [
          { name: "status", label: "Status", type: "select", options: opt("draft", "published", "scheduled", "archived") },
          { name: "publishDate", label: "Publish date", type: "datetime", hint: "scheduled posts go live at this time" },
          { name: "featured", label: "Featured", type: "switch" },
        ],
      },
      { title: "SEO", columns: 1, fields: [seo] },
    ],
  },

  "guest-shorts": {
    key: "guest-shorts",
    title: "Guest Shorts",
    singular: "Guest short",
    description: "Real guest videos only (YouTube, Instagram, TikTok or uploaded).",
    endpoint: "/admin/guest-shorts",
    permission: "guestShorts",
    titleKey: "title",
    imageKey: "thumbnail",
    statusField: "status",
    statusOptions: ["draft", "published", "archived"],
    reorderable: true,
    featurable: true,
    translationType: "guestShort",
    columns: [thumb("thumbnail.url"), { key: "title", label: "Title" }, { key: "guestName", label: "Guest" }, { key: "platform", label: "Platform" }, { key: "status", label: "Status", kind: "status" }],
    defaults: { status: "draft", platform: "youtube" },
    sections: [
      {
        title: "Video",
        fields: [
          { name: "title", label: "Title", type: "text", required: true, span: 2 },
          { name: "guestName", label: "Guest name", type: "text" },
          { name: "country", label: "Country", type: "text" },
          { name: "platform", label: "Platform", type: "select", options: opt("youtube", "instagram", "tiktok", "upload"), required: true },
          { name: "date", label: "Date", type: "date" },
          // Mirrors the API rule: "upload" needs an uploaded video; YouTube / Instagram / TikTok need the external URL.
          {
            name: "videoUrl",
            label: "Video URL",
            type: "url",
            span: 2,
            required: true,
            placeholder: "https://www.youtube.com/shorts/…",
            hint: "YouTube, Instagram or TikTok link",
            showWhen: { field: "platform", notIn: ["upload"] },
          },
          { name: "uploadedMedia", label: "Uploaded video", type: "media", accept: "video", folder: "guest-shorts", required: true, span: 2, showWhen: { field: "platform", in: ["upload"] } },
          { name: "thumbnail", label: "Thumbnail", type: "media", folder: "guest-shorts", hint: "optional for uploads – a frame of the video is used" },
          { name: "description", label: "Description", type: "textarea", span: 2 },
        ],
      },
      { title: "Publishing", fields: publishing() },
    ],
  },

  reviews: {
    key: "reviews",
    title: "Reviews",
    singular: "Review",
    description: "Approve guest-submitted reviews or add genuine reviews from other platforms.",
    endpoint: "/admin/reviews",
    permission: "reviews",
    titleKey: "guestName",
    statusField: "status",
    statusOptions: ["pending", "published", "rejected"],
    featurable: true,
    columns: [{ key: "guestName", label: "Guest" }, { key: "country", label: "Country" }, { key: "rating", label: "Rating", kind: "stars" }, { key: "platform", label: "Platform" }, { key: "date", label: "Date", kind: "date" }, { key: "status", label: "Status", kind: "status" }, { key: "featured", label: "Featured", kind: "bool" }],
    filters: [{ key: "platform", label: "Platform", options: opt("website", "tripadvisor", "google", "facebook", "other") }],
    defaults: { status: "published", rating: 5, platform: "website", verified: false },
    sections: [
      {
        title: "Review",
        fields: [
          { name: "guestName", label: "Guest name", type: "text", required: true },
          { name: "country", label: "Country", type: "text" },
          { name: "rating", label: "Rating (1–5)", type: "number", min: 1, max: 5, required: true },
          { name: "date", label: "Date", type: "date" },
          { name: "title", label: "Title", type: "text", span: 2 },
          { name: "review", label: "Review", type: "textarea", required: true, span: 2 },
          { name: "platform", label: "Source platform", type: "select", options: opt("website", "tripadvisor", "google", "facebook", "other") },
          { name: "sourceUrl", label: "Source URL", type: "url" },
          { name: "tour", label: "Tour", type: "relation", endpoint: "/admin/tours", labelKey: "title" },
          { name: "photo", label: "Guest photo", type: "media", folder: "reviews" },
        ],
      },
      {
        title: "Moderation",
        fields: [
          { name: "status", label: "Status", type: "select", options: opt("pending", "published", "rejected") },
          { name: "verified", label: "Verified guest", type: "switch" },
          { name: "featured", label: "Featured (testimonial)", type: "switch" },
          { name: "order", label: "Order", type: "number" },
        ],
      },
    ],
  },

  faqs: {
    key: "faqs",
    title: "FAQs",
    singular: "FAQ",
    endpoint: "/admin/faqs",
    permission: "faqs",
    titleKey: "question",
    statusField: "status",
    statusOptions: ["draft", "published", "archived"],
    reorderable: true,
    duplicable: true,
    featurable: true,
    translationType: "faq",
    columns: [{ key: "question", label: "Question" }, { key: "category", label: "Category" }, { key: "order", label: "Order", kind: "number" }, { key: "status", label: "Status", kind: "status" }],
    defaults: { status: "published", category: "General" },
    sections: [
      {
        title: "FAQ",
        fields: [
          { name: "question", label: "Question", type: "text", required: true, span: 2 },
          { name: "answer", label: "Answer", type: "markdown", required: true },
          { name: "category", label: "Category", type: "text" },
        ],
      },
      { title: "Publishing", fields: publishing() },
    ],
  },

  navigation: {
    key: "navigation",
    title: "Navbar",
    singular: "Menu item",
    description: "Header menu. Use 'Parent' to build dropdowns; tick 'CTA button' for the highlighted button.",
    endpoint: "/admin/navigation",
    permission: "navigation",
    titleKey: "label",
    statusField: "enabled",
    reorderable: true,
    duplicable: true,
    translationType: "navigationItem",
    columns: [{ key: "label", label: "Label" }, { key: "url", label: "URL" }, { key: "parent", label: "Parent", kind: "category" }, { key: "isCta", label: "CTA", kind: "bool" }, { key: "enabled", label: "Enabled", kind: "bool" }],
    defaults: { enabled: true, isCta: false, openInNewTab: false },
    sections: [
      {
        title: "Menu item",
        fields: [
          { name: "label", label: "Label", type: "text", required: true },
          { name: "url", label: "URL", type: "text", hint: "/tours or https://… (leave empty for a dropdown parent)" },
          { name: "parent", label: "Parent (for dropdowns)", type: "relation", endpoint: "/admin/navigation", labelKey: "label" },
          { name: "order", label: "Order", type: "number" },
          { name: "isCta", label: "CTA button", type: "switch" },
          { name: "openInNewTab", label: "Open in new tab", type: "switch" },
          { name: "enabled", label: "Enabled", type: "switch" },
        ],
      },
    ],
  },

  seo: {
    key: "seo",
    title: "SEO",
    singular: "SEO entry",
    description: "'global' holds site-wide defaults; other keys (tours, gallery, …) override listing pages.",
    endpoint: "/admin/seo",
    permission: "seo",
    titleKey: "key",
    columns: [{ key: "key", label: "Key" }, { key: "seoTitle", label: "Title" }, { key: "robots", label: "Robots" }],
    defaults: { robots: "index,follow" },
    sections: [
      {
        title: "SEO",
        fields: [
          { name: "key", label: "Key", type: "text", required: true, hint: "global, home, tours, destinations…" },
          { name: "titleTemplate", label: "Title template (global)", type: "text", placeholder: "%s | {siteName}", hint: "%s = page title, {siteName} = site name" },
          { name: "seoTitle", label: "SEO title", type: "text", span: 2 },
          { name: "metaDescription", label: "Meta description", type: "textarea", span: 2 },
          { name: "keywords", label: "Keywords", type: "tags", span: 2 },
          { name: "canonicalUrl", label: "Canonical URL", type: "url" },
          { name: "robots", label: "Robots", type: "text" },
          { name: "ogTitle", label: "OpenGraph title", type: "text" },
          { name: "twitterHandle", label: "Twitter handle", type: "text" },
          { name: "ogDescription", label: "OpenGraph description", type: "textarea", span: 2 },
          { name: "ogImage", label: "Default OpenGraph image", type: "media", folder: "seo" },
          { name: "googleSiteVerification", label: "Google site verification", type: "text" },
        ],
      },
    ],
  },

  "tour-categories": categoryResource("tour", "Tour Categories", "tours"),
  "destination-categories": categoryResource("destination", "Destination Categories", "destinations"),
  "excursion-categories": categoryResource("excursion", "Excursion Categories", "excursions"),
  "vehicle-categories": categoryResource("vehicle", "Vehicle Categories", "vehicles"),
  "blog-categories": categoryResource("blog", "Blog Categories", "blog"),
  "gallery-categories": categoryResource("gallery", "Gallery Categories", "gallery"),
};

/** Testimonials = featured, published reviews (shown in the homepage reviews section). */
RESOURCES.testimonials = {
  ...RESOURCES.reviews,
  key: "testimonials",
  title: "Testimonials",
  description: "Featured reviews shown as testimonials on the homepage.",
  fixedQuery: { featured: "true" },
  fixedValues: { featured: true },
};
