import type { FieldDef, FormSection } from "@/components/admin/form/types";

export const SECTION_TYPES: { value: string; label: string; help: string }[] = [
  { value: "hero", label: "Hero slider", help: "Shows the slides from Media → Hero Media." },
  { value: "whyChooseUs", label: "Why choose us", help: "Feature cards with icons." },
  { value: "popularTours", label: "Popular tours", help: "Featured / latest tours." },
  { value: "destinations", label: "Destinations", help: "Destination cards." },
  { value: "excursions", label: "Excursions", help: "Excursion cards." },
  { value: "vehicles", label: "Vehicles", help: "Vehicle cards." },
  { value: "tailorMade", label: "Tailor-made CTA", help: "Call-to-action for tailor-made tours." },
  { value: "gallery", label: "Gallery", help: "Gallery strip." },
  { value: "guestShorts", label: "Guest shorts", help: "Guest video shorts." },
  { value: "reviews", label: "Reviews", help: "Approved reviews / testimonials." },
  { value: "tripadvisor", label: "TripAdvisor", help: "TripAdvisor rating & link." },
  { value: "blog", label: "Blog", help: "Latest blog posts." },
  { value: "faqs", label: "FAQs", help: "FAQ accordion." },
  { value: "features", label: "Feature grid", help: "Generic icon cards." },
  { value: "richText", label: "Rich text", help: "Free text content." },
  { value: "contact", label: "Contact details", help: "Phone, WhatsApp, email, address." },
  { value: "cta", label: "Call to action", help: "Banner with buttons." },
  { value: "team", label: "Team", help: "Owner, managers and staff with profile photos. The first person is shown large (e.g. the owner)." },
  { value: "offer", label: "Special offer", help: "Exclusive deal card: badge, offer title, included items, bonuses (star icon) and price." },
];
export const typeLabel = (t: string) => SECTION_TYPES.find((s) => s.value === t)?.label ?? t;

const linkList: FieldDef = {
  name: "buttons",
  label: "Buttons",
  type: "objectList",
  itemTitle: "label",
  addLabel: "Add button",
  defaults: { variant: "primary" },
  fields: [
    { name: "label", label: "Label", type: "text" },
    { name: "url", label: "URL", type: "text", hint: "/tours, https://…, or 'whatsapp'" },
    { name: "variant", label: "Style", type: "select", options: ["primary", "secondary", "outline", "whatsapp", "link"].map((v) => ({ value: v, label: v })) },
    { name: "openInNewTab", label: "New tab", type: "switch" },
  ],
};

/** Section types that list content, and the category kind they can be filtered by. */
const CATEGORY_KIND: Record<string, string> = {
  popularTours: "tour",
  destinations: "destination",
  excursions: "excursion",
  vehicles: "vehicle",
  gallery: "gallery",
  blog: "blog",
};

/** Section types with a highlighted short line, and how to label it. */
const BADGE_HINT: Record<string, { label: string; placeholder: string; hint?: string }> = {
  popularTours: { label: "Season line", placeholder: "(November to April)", hint: "shown under the title" },
  destinations: { label: "Season line", placeholder: "(May to September)", hint: "shown under the title" },
  excursions: { label: "Season line", placeholder: "(All year)", hint: "shown under the title" },
  offer: { label: "Badge", placeholder: "Limited offer – 30% off" },
  tailorMade: { label: "Floating badge", placeholder: "15+ years of local expertise", hint: "photo layout only" },
};

export function sectionForm(type: string): FormSection[] {
  const data = ["popularTours", "destinations", "excursions", "vehicles", "gallery", "guestShorts", "reviews", "blog", "faqs"].includes(type);
  return [
    {
      title: "Content",
      fields: [
        { name: "name", label: "Internal name", type: "text", hint: "only shown in admin" },
        { name: "enabled", label: "Enabled", type: "switch", hint: "visible on the website" },
        {
          name: "eyebrow",
          label: type === "offer" ? "Section heading" : "Eyebrow (small heading)",
          type: "text",
          placeholder: type === "offer" ? "Exclusive Deals for You" : undefined,
        },
        { name: "title", label: type === "offer" ? "Offer title" : "Title", type: "text", placeholder: type === "offer" ? "10-Day Luxury Sri Lanka Tour" : undefined },
        ...(BADGE_HINT[type]
          ? [{ name: "badge", label: BADGE_HINT[type].label, type: "text", placeholder: BADGE_HINT[type].placeholder, hint: BADGE_HINT[type].hint } as FieldDef]
          : []),
        { name: "subtitle", label: type === "offer" ? "Offer description" : "Subtitle", type: "textarea", span: 2 },
        ...(type === "team"
          ? ([
              {
                name: "items",
                label: "People (first = shown large, e.g. the owner)",
                type: "objectList",
                itemTitle: "title",
                addLabel: "Add person",
                fields: [
                  { name: "title", label: "Name", type: "text", required: true },
                  { name: "role", label: "Role", type: "text", placeholder: "Owner / Manager / Chauffeur guide" },
                  { name: "image", label: "Profile photo", type: "media", folder: "pages", span: 2 },
                  { name: "description", label: "Short bio", type: "textarea", span: 2 },
                  { name: "url", label: "Link (optional)", type: "url", placeholder: "https://www.linkedin.com/in/…", span: 2 },
                ],
              },
            ] as FieldDef[])
          : []),
        ...(type === "offer"
          ? ([
              { name: "price", label: "Price", type: "text", placeholder: "$700" },
              { name: "priceNote", label: "Price note", type: "text", placeholder: "For 2 travellers" },
              {
                name: "items",
                label: "Included items & bonuses",
                type: "objectList",
                itemTitle: "title",
                addLabel: "Add item",
                fields: [
                  { name: "title", label: "Text", type: "text", required: true, span: 2 },
                  {
                    name: "icon",
                    label: "List",
                    type: "select",
                    options: [
                      { value: "check", label: "Included (✓)" },
                      { value: "star", label: "Complimentary bonus (★)" },
                    ],
                  },
                ],
              },
            ] as FieldDef[])
          : []),
        ...(["richText", "cta", "tailorMade", "features", "whyChooseUs"].includes(type) ? [{ name: "content", label: "Text", type: "markdown" } as FieldDef] : []),
        ...(["whyChooseUs", "features", "tailorMade", "cta"].includes(type)
          ? [
              {
                name: "items",
                label: type === "tailorMade" || type === "cta" ? "Bullet points" : "Items",
                type: "objectList",
                itemTitle: "title",
                addLabel: "Add item",
                fields: [
                  { name: "title", label: "Title", type: "text" },
                  { name: "icon", label: "Icon", type: "icon" },
                  { name: "description", label: "Description", type: "textarea", span: 2 },
                  { name: "url", label: "Link", type: "text" },
                  { name: "image", label: "Image", type: "media", folder: "pages" },
                ],
              } as FieldDef,
            ]
          : []),
        ...(["tailorMade", "cta", "richText"].includes(type)
          ? [
              {
                name: "media",
                label: type === "tailorMade" ? "Photo (shows the split photo layout)" : "Background image",
                type: "media",
                folder: "pages",
                span: 2,
              } as FieldDef,
            ]
          : []),
        linkList,
      ],
    },
    {
      title: "Display",
      fields: [
        {
          name: "settings",
          label: "Settings",
          type: "group",
          fields: [
            { name: "theme", label: "Background", type: "select", options: ["light", "sand", "forest", "dark"].map((v) => ({ value: v, label: v })) },
            ...(type === "reviews" || type === "gallery"
              ? ([
                  {
                    name: "layout",
                    label: "Layout",
                    type: "select",
                    options: [
                      { value: "grid", label: "Grid" },
                      { value: "carousel", label: "Sliding (animated)" },
                    ],
                  },
                ] as FieldDef[])
              : []),
            ...(type === "popularTours"
              ? ([
                  {
                    name: "layout",
                    label: "Layout",
                    type: "select",
                    options: [
                      { value: "grid", label: "Grid of cards" },
                      { value: "split", label: "Featured tour band (first tour large, dark green)" },
                      { value: "staggered", label: "Staggered tall photo cards (3 at different heights)" },
                    ],
                  },
                ] as FieldDef[])
              : []),
            ...(data
              ? ([
                  { name: "limit", label: "Number of items", type: "number", min: 1, max: 24 },
                  {
                    name: "source",
                    label: "Which items",
                    type: "select",
                    options: [
                      { value: "featured", label: "Featured first" },
                      { value: "latest", label: "Latest" },
                      { value: "all", label: "All (ordered)" },
                      // Switches by itself: Down South tours November–June, East Coast tours July–October. The season line
                      // then shows those months automatically (PopularToursSection).
                      ...(type === "popularTours" ? [{ value: "season", label: "In season now (Down South / East Coast)" }] : []),
                    ],
                  },
                ] as FieldDef[])
              : []),
            // Category filter, e.g. a "Seasonal tours" or "One-day tours" section showing only that category.
            ...(CATEGORY_KIND[type]
              ? ([
                  {
                    name: "category",
                    label: "Only this category",
                    type: "relation",
                    endpoint: "/admin/categories",
                    labelKey: "name",
                    query: { kind: CATEGORY_KIND[type] },
                    hint: "optional – e.g. Seasonal or One-day tours",
                  },
                ] as FieldDef[])
              : []),
          ],
        },
      ],
    },
  ];
}

export const pageForm: FormSection[] = [
  {
    title: "Page header",
    fields: [
      { name: "title", label: "Title", type: "text", required: true, span: 2 },
      { name: "subtitle", label: "Subtitle", type: "textarea", span: 2 },
      { name: "heroImage", label: "Header image", type: "media", folder: "pages", span: 2 },
      { name: "content", label: "Body text (optional)", type: "markdown" },
      { name: "status", label: "Status", type: "select", options: [{ value: "published", label: "Published" }, { value: "draft", label: "Draft" }] },
    ],
  },
  {
    title: "SEO",
    description: "Controls search metadata, the browser tab title and shared-link previews. The visible page heading uses Title above.",
    columns: 1,
    fields: [
      {
        name: "seo",
        label: "SEO",
        type: "group",
        fields: [
          { name: "seoTitle", label: "SEO title", type: "text" },
          { name: "canonicalUrl", label: "Canonical URL", type: "url" },
          { name: "metaDescription", label: "Meta description", type: "textarea", span: 2 },
          { name: "keywords", label: "Keywords", type: "tags", span: 2 },
          { name: "ogTitle", label: "OpenGraph title", type: "text" },
          { name: "robots", label: "Robots", type: "text" },
          { name: "ogDescription", label: "OpenGraph description", type: "textarea", span: 2 },
          { name: "ogImage", label: "OpenGraph image", type: "media", folder: "seo", span: 2 },
        ],
      },
    ],
  },
];

