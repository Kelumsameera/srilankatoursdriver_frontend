"use client";

import { use, useMemo, useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowLeft, ArrowUp, Copy, Eye, EyeOff, Pencil, Plus, Trash2, MonitorPlay } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import { EntityForm } from "@/components/admin/form/EntityForm";
import { SECTION_TYPES, typeLabel, sectionForm, pageForm } from "@/lib/admin/page-fields";
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

export default function PageEditor({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = use(params);
  const { can } = useAuth();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<Section | null>(null);
  const editingType = editing?.type;
  const editingForm = useMemo(() => sectionForm(editingType ?? "richText"), [editingType]);
  const [adding, setAdding] = useState(false);
  const [newType, setNewType] = useState("richText");
  const [newEnabled, setNewEnabled] = useState(true);
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
  const refresh = () => Promise.all([
    qc.invalidateQueries({ queryKey: ["page", slug] }),
    qc.invalidateQueries({ queryKey: ["pages"] }),
  ]);

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
        {sections.some((s) => !s.enabled) && (
          <p className="mt-3 text-sm text-amber-700">
            Disabled sections are hidden in View live. Use the eye button to enable them. Preview includes disabled sections.
          </p>
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
            sections={editingForm}
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
                  await api.post(`/admin/pages/${page._id}/sections`, { type: newType, title: typeLabel(newType), enabled: newEnabled });
                  setAdding(false);
                }, newEnabled ? "Section added" : "Section added (hidden from website)")
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
        <label className="mt-4 flex items-center gap-2 text-sm text-slate-700">
          <input type="checkbox" checked={newEnabled} onChange={(event) => setNewEnabled(event.target.checked)} className="accent-forest-700" />
          Show on website (when this page is published)
        </label>
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
