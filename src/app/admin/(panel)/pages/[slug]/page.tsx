"use client";

import { use, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, EyeOff, Pencil, Plus, Trash2, MonitorPlay } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import { EntityForm } from "@/components/admin/form/EntityForm";
import type { FieldDef, FormSection } from "@/components/admin/form/types";
import { Button, Card, ConfirmDialog, ErrorBlock, LoadingBlock, Modal, PageHeader, Select, StatusBadge, Label } from "@/components/admin/ui";

interface Section {
  _id: string;
  type: string;
  name?: string;
  title?: string;
  enabled: boolean;
  order: number;
  [k: string]: unknown;
}
interface PageDoc {
  _id: string;
  slug: string;
  title: string;
  isSystem: boolean;
  status: string;
  sections: Section[];
  [k: string]: unknown;
}

const SECTION_TYPES: { value: string; label: string; help: string }[] = [
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
const typeLabel = (t: string) => SECTION_TYPES.find((s) => s.value === t)?.label ?? t;

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

function sectionForm(type: string): FormSection[] {
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
            ...(data
              ? ([
                  { name: "limit", label: "Number of items", type: "number", min: 1, max: 24 },
                  { name: "source", label: "Which items", type: "select", options: [{ value: "featured", label: "Featured first" }, { value: "latest", label: "Latest" }, { value: "all", label: "All (ordered)" }] },
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

const pageForm: FormSection[] = [
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

export default function PageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { can } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Section | null>(null);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState("richText");
  const [deleting, setDeleting] = useState<Section | null>(null);
  const [busy, setBusy] = useState(false);

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["page", slug],
    queryFn: async () => {
      const list = await api.get<{ _id: string; slug: string }[]>("/admin/pages");
      const match = list.data.find((p) => p.slug === slug || p._id === slug);
      if (!match) throw new Error("Page not found");
      return (await api.get<PageDoc>(`/admin/pages/${match._id}`)).data;
    },
  });

  if (isLoading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const page = data;
  const sections = [...page.sections].sort((a, b) => a.order - b.order);
  const editable = can("pages:update");
  const refresh = () => qc.invalidateQueries({ queryKey: ["page", slug] });

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const move = (i: number, dir: -1 | 1) => {
    const next = [...sections];
    const j = i + dir;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    return run(() => api.patch(`/admin/pages/${page._id}/sections/reorder`, { items: next.map((s, idx) => ({ id: s._id, order: idx + 1 })) }), "Order saved");
  };

  const preview = async () => {
    try {
      const { data: tok } = await api.post<{ token: string }>("/admin/preview-token", { slug: page.slug });
      window.open(`/en/preview/${page.slug}?token=${encodeURIComponent(tok.token)}`, "_blank", "noopener");
    } catch (err) {
      toast.error(errorMessage(err));
    }
  };

  const publicUrl = page.slug === "home" ? "/en" : ["tours", "destinations", "excursions", "vehicles", "tailor-made-tours", "gallery", "blog", "reviews", "contact", "booking", "faqs"].includes(page.slug) || !page.isSystem ? `/en/${page.slug}` : null;

  return (
    <div className="space-y-6">
      <div>
        <Link href="/admin/pages" className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
          <ArrowLeft className="h-4 w-4" /> Pages
        </Link>
        <PageHeader
          title={page.slug === "home" ? "Homepage" : page.title}
          description={page.slug === "home" ? "Add, edit, reorder, enable/disable and preview every homepage section." : `/${page.slug}`}
          actions={
            <>
              <Button variant="outline" onClick={preview}>
                <MonitorPlay className="h-4 w-4" /> Preview (incl. disabled)
              </Button>
              {publicUrl && (
                <a href={publicUrl} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                  View live
                </a>
              )}
            </>
          }
        />
      </div>

      <Card
        title={`Sections (${sections.length})`}
        actions={
          editable && (
            <Button size="sm" onClick={() => setAdding(true)} data-testid="add-section">
              <Plus className="h-3.5 w-3.5" /> Add section
            </Button>
          )
        }
      >
        {sections.length === 0 ? (
          <p className="text-sm text-slate-500">No sections – this page shows only its header{page.isSystem ? " and built-in listing" : ""}.</p>
        ) : (
          <ol className="space-y-2" data-testid="section-list">
            {sections.map((s, i) => (
              <li key={s._id} className={cn("flex flex-wrap items-center gap-3 rounded-lg border px-3 py-2.5", s.enabled ? "border-slate-200 bg-white" : "border-dashed border-slate-300 bg-slate-50")}>
                <span className="w-6 text-center text-xs text-slate-400">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-medium text-slate-800">{s.name || s.title || typeLabel(s.type)}</p>
                  <p className="text-xs text-slate-500">{typeLabel(s.type)}</p>
                </div>
                <StatusBadge status={s.enabled} />
                {editable && (
                  <div className="flex items-center gap-0.5">
                    <Button variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0 || busy} aria-label="Move up">
                      <ArrowUp className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === sections.length - 1 || busy} aria-label="Move down">
                      <ArrowDown className="h-3.5 w-3.5" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      aria-label={s.enabled ? "Disable" : "Enable"}
                      title={s.enabled ? "Disable" : "Enable"}
                      onClick={() => run(() => api.put(`/admin/pages/${page._id}/sections/${s._id}`, { enabled: !s.enabled }), s.enabled ? "Section disabled" : "Section enabled")}
                    >
                      {s.enabled ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Duplicate" title="Duplicate" onClick={() => run(() => api.post(`/admin/pages/${page._id}/sections/${s._id}/duplicate`), "Section duplicated (disabled)")}>
                      <Copy className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Edit" title="Edit" onClick={() => setEditing(s)} data-testid={`edit-section-${s.type}`}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="sm" aria-label="Delete" title="Delete" onClick={() => setDeleting(s)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  </div>
                )}
              </li>
            ))}
          </ol>
        )}
        {sections.some((s) => s.type === "hero") && (
          <p className="mt-3 text-xs text-slate-500">
            Hero slides are managed in{" "}
            <Link className="text-forest-700 underline" href="/admin/content/hero">
              Media → Hero Media
            </Link>
            .
          </p>
        )}
      </Card>

      <div>
        <h2 className="mb-3 font-sans text-sm font-semibold uppercase tracking-wide text-slate-500">Page details & SEO</h2>
        <EntityForm
          sections={pageForm}
          initial={page}
          readOnly={!editable}
          onSubmit={async (payload) => {
            await api.put(`/admin/pages/${page._id}`, payload);
            toast.success("Page saved");
            await refresh();
          }}
        />
      </div>

      <Modal open={!!editing} onClose={() => setEditing(null)} title={editing ? `Edit section – ${typeLabel(editing.type)}` : ""} wide>
        {editing && (
          <EntityForm
            sections={sectionForm(editing.type)}
            initial={editing}
            onSubmit={async (payload) => {
              await api.put(`/admin/pages/${page._id}/sections/${editing._id}`, payload);
              toast.success("Section saved");
              setEditing(null);
              await refresh();
            }}
          />
        )}
      </Modal>

      <Modal
        open={adding}
        onClose={() => setAdding(false)}
        title="Add section"
        footer={
          <>
            <Button variant="outline" onClick={() => setAdding(false)}>
              Cancel
            </Button>
            <Button
              loading={busy}
              onClick={() =>
                run(async () => {
                  await api.post(`/admin/pages/${page._id}/sections`, { type: newType, title: typeLabel(newType), enabled: false });
                  setAdding(false);
                }, "Section added (disabled – edit and enable it when ready)")
              }
            >
              Add
            </Button>
          </>
        }
      >
        <Label htmlFor="section-type">Section type</Label>
        <Select id="section-type" value={newType} onChange={(e) => setNewType(e.target.value)}>
          {SECTION_TYPES.map((t) => (
            <option key={t.value} value={t.value}>
              {t.label}
            </option>
          ))}
        </Select>
        <p className="mt-2 text-sm text-slate-500">{SECTION_TYPES.find((t) => t.value === newType)?.help}</p>
      </Modal>

      <ConfirmDialog
        open={!!deleting}
        title="Delete section?"
        message="This section and its translations will be removed. Tip: disable it instead if you may need it later."
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={() => run(() => api.del(`/admin/pages/${page._id}/sections/${deleting!._id}`), "Section deleted").then(() => setDeleting(null))}
      />
    </div>
  );
}
