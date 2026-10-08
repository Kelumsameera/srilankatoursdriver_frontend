"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { formatDate } from "@/lib/utils";
import { Button, ConfirmDialog, ErrorBlock, FieldError, Input, Label, LoadingBlock, Modal, PageHeader, StatusBadge } from "@/components/admin/ui";

interface PageRow {
  _id: string;
  slug: string;
  title: string;
  isSystem: boolean;
  status: string;
  sectionCount: number;
  updatedAt: string;
}

export default function PagesPage() {
  const { can } = useAuth();
  const router = useRouter();
  const qc = useQueryClient();
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({ title: "", slug: "" });
  const [deleting, setDeleting] = useState<PageRow | null>(null);
  const [busy, setBusy] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["pages"], queryFn: () => api.get<PageRow[]>("/admin/pages") });

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const pages = data?.data ?? [];
  const slug = (form.slug || form.title).toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  const slugTaken = pages.some((p) => p.slug === slug);
  const slugError = !form.title.trim() ? null : !slug ? "Enter a slug using Latin letters, numbers and hyphens" : slugTaken ? "A page with this slug already exists" : null;

  const create = async () => {
    if (!form.title.trim() || slugError) return;
    setBusy(true);
    try {
      await api.post("/admin/pages", { title: form.title, slug, status: "draft" });
      toast.success("Page created");
      setCreating(false);
      await qc.invalidateQueries({ queryKey: ["pages"] });
      router.push(`/admin/pages/${slug}`);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Pages"
        description="Every page's header, SEO and sections. System pages map to fixed routes; custom pages (e.g. privacy policy) appear at /your-slug."
        actions={
          can("pages:create") && (
            <Button onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New page
            </Button>
          )
        }
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start">Page</th>
              <th className="px-4 py-3 text-start">URL</th>
              <th className="px-4 py-3 text-start">Sections</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-start">Updated</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {pages.map((p) => (
              <tr key={p._id} className="hover:bg-slate-50/60">
                <td className="px-4 py-3">
                  <Link href={`/admin/pages/${p.slug}`} className="flex items-center gap-2 font-medium hover:text-forest-700">
                    {p.isSystem && <Lock className="h-3.5 w-3.5 text-slate-400" aria-label="System page" />}
                    {p.title}
                  </Link>
                </td>
                <td className="px-4 py-3 font-mono text-xs text-slate-500">/{p.slug === "home" ? "" : p.slug}</td>
                <td className="px-4 py-3">{p.sectionCount}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={p.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{formatDate(p.updatedAt)}</td>
                <td className="px-4 py-3 text-end">
                  {!p.isSystem && can("pages:delete") && (
                    <Button variant="ghost" size="sm" onClick={() => setDeleting(p)} aria-label="Delete">
                      <Trash2 className="h-4 w-4 text-red-600" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={creating}
        onClose={() => setCreating(false)}
        title="New page"
        footer={
          <>
            <Button variant="outline" onClick={() => setCreating(false)}>
              Cancel
            </Button>
            <Button onClick={create} loading={busy} disabled={!form.title.trim() || !!slugError}>
              Create
            </Button>
          </>
        }
      >
        <div className="space-y-4">
          <div>
            <Label htmlFor="np-title" required>
              Title
            </Label>
            <Input id="np-title" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
          </div>
          <div>
            <Label htmlFor="np-slug" hint="lowercase-with-hyphens">
              Slug
            </Label>
            <Input id="np-slug" value={form.slug} placeholder={slug || "about-us"} aria-invalid={!!slugError} onChange={(e) => setForm({ ...form, slug: e.target.value })} />
            <FieldError message={slugError ?? undefined} />
            {!slugError && slug && <p className="mt-1 text-xs text-slate-500">URL: /{slug}</p>}
          </div>
        </div>
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title="Delete page?"
        message={`“${deleting?.title}” and all its sections will be deleted.`}
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.del(`/admin/pages/${deleting!._id}`);
            toast.success("Page deleted");
            await qc.invalidateQueries({ queryKey: ["pages"] });
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setBusy(false);
            setDeleting(null);
          }
        }}
      />
    </div>
  );
}
