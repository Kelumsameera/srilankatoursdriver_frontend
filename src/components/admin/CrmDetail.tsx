"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, Mail, MessageCircle, Phone, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { formatDate, whatsappLink } from "@/lib/utils";
import { Button, Card, ConfirmDialog, ErrorBlock, Input, Label, LoadingBlock, PageHeader, Select, StatusBadge, Textarea } from "./ui";

export type CrmRecord = Record<string, unknown> & {
  _id: string;
  reference?: string;
  status: string;
  createdAt: string;
  notes?: { _id: string; text: string; authorName?: string; createdAt: string }[];
  statusHistory?: { status: string; changedAt: string }[];
  assignedTo?: { _id: string; name: string; email: string } | null;
  quotedAmount?: number;
  currency?: string;
};

interface Props {
  id: string;
  endpoint: string;
  listHref: string;
  listLabel: string;
  permission: string;
  statuses: string[];
  title: (r: CrmRecord) => string;
  contact: (r: CrmRecord) => { email?: string; phone?: string; whatsapp?: string; name?: string };
  children: (r: CrmRecord) => ReactNode;
  showQuote?: boolean;
}

/** Shared CRM record view: status workflow, assignment, quote, notes timeline, quick contact and delete. */
export function CrmDetail({ id, endpoint, listHref, listLabel, permission, statuses, title, contact, children, showQuote = true }: Props) {
  const qc = useQueryClient();
  const router = useRouter();
  const { can } = useAuth();
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const key = ["crm-item", endpoint, id];
  const { data, isLoading, error, refetch } = useQuery({ queryKey: key, queryFn: () => api.get<CrmRecord>(`${endpoint}/${id}`) });
  const users = useQuery({
    queryKey: ["users-min"],
    queryFn: () => api.get<{ _id: string; name: string; status: string }[]>("/admin/users?limit=100"),
    enabled: can("users:read"),
  });
  const [quote, setQuote] = useState<string | null>(null);

  if (isLoading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const r = data.data;
  const editable = can(`${permission}:update`);
  const c = contact(r);

  const patch = async (body: Record<string, unknown>, msg: string) => {
    setBusy(true);
    try {
      await api.patch(`${endpoint}/${id}`, body);
      toast.success(msg);
      await qc.invalidateQueries({ queryKey: key });
      await qc.invalidateQueries({ queryKey: ["crm"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  const addNote = async () => {
    if (!note.trim()) return;
    setBusy(true);
    try {
      await api.post(`${endpoint}/${id}/notes`, { text: note });
      setNote("");
      await qc.invalidateQueries({ queryKey: key });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <Link href={listHref} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {listLabel}
      </Link>
      <PageHeader
        title={title(r)}
        description={`${r.reference ?? ""} · received ${formatDate(r.createdAt, "en", { dateStyle: "long", timeStyle: "short" })}`}
        actions={
          can(`${permission}:delete`) && (
            <Button variant="outline" onClick={() => setDeleting(true)}>
              <Trash2 className="h-4 w-4 text-red-600" /> Delete
            </Button>
          )
        }
      />
      <div className="grid gap-6 xl:grid-cols-[1fr_340px]">
        <div className="min-w-0 space-y-6">
          {children(r)}
          <Card title="Notes">
            <ul className="mb-4 space-y-3">
              {(r.notes ?? []).length === 0 && <li className="text-sm text-slate-500">No notes yet.</li>}
              {(r.notes ?? []).map((n) => (
                <li key={n._id} className="rounded-lg bg-slate-50 p-3 text-sm">
                  <p className="whitespace-pre-wrap text-slate-800">{n.text}</p>
                  <p className="mt-1 text-xs text-slate-400">
                    {n.authorName} · {formatDate(n.createdAt, "en", { dateStyle: "medium", timeStyle: "short" })}
                  </p>
                </li>
              ))}
            </ul>
            {editable && (
              <div className="space-y-2">
                <Textarea placeholder="Add an internal note (quote sent, call summary…)" value={note} onChange={(e) => setNote(e.target.value)} aria-label="New note" />
                <Button size="sm" onClick={addNote} loading={busy} disabled={!note.trim()}>
                  Add note
                </Button>
              </div>
            )}
          </Card>
        </div>
        <div className="space-y-4">
          <Card title="Status">
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <StatusBadge status={r.status} />
              </div>
              {editable && (
                <div>
                  <Label htmlFor="crm-status">Change status</Label>
                  <Select id="crm-status" value={r.status} onChange={(e) => patch({ status: e.target.value }, `Status → ${e.target.value}`)} disabled={busy} data-testid="crm-status">
                    {statuses.map((s) => (
                      <option key={s} value={s}>
                        {s}
                      </option>
                    ))}
                  </Select>
                </div>
              )}
              {editable && users.data && (
                <div>
                  <Label htmlFor="crm-assign">Assigned to</Label>
                  <Select id="crm-assign" value={r.assignedTo?._id ?? ""} onChange={(e) => patch({ assignedTo: e.target.value || null }, "Assignment updated")} disabled={busy}>
                    <option value="">— Unassigned —</option>
                    {users.data.data
                      .filter((u) => u.status === "active")
                      .map((u) => (
                        <option key={u._id} value={u._id}>
                          {u.name}
                        </option>
                      ))}
                  </Select>
                </div>
              )}
              {!editable && r.assignedTo && <p className="text-sm">Assigned to {r.assignedTo.name}</p>}
              {showQuote && editable && (
                <div>
                  <Label htmlFor="crm-quote">Quoted amount</Label>
                  <div className="flex gap-2">
                    <Input id="crm-quote" type="number" min={0} value={quote ?? (r.quotedAmount ?? "")} onChange={(e) => setQuote(e.target.value)} />
                    <Button variant="outline" onClick={() => patch({ quotedAmount: quote === "" ? null : Number(quote) }, "Quote saved")} disabled={quote === null}>
                      Save
                    </Button>
                  </div>
                </div>
              )}
              {r.statusHistory && r.statusHistory.length > 0 && (
                <div>
                  <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-slate-500">History</p>
                  <ol className="space-y-1 text-xs text-slate-500">
                    {r.statusHistory.map((h, i) => (
                      <li key={i}>
                        <span className="capitalize text-slate-700">{h.status}</span> · {formatDate(h.changedAt, "en", { dateStyle: "short", timeStyle: "short" })}
                      </li>
                    ))}
                  </ol>
                </div>
              )}
            </div>
          </Card>
          <Card title="Contact">
            <div className="flex flex-col gap-2 text-sm">
              {c.email && (
                <a href={`mailto:${c.email}?subject=${encodeURIComponent(r.reference ?? "")}`} className="flex items-center gap-2 text-forest-700 hover:underline">
                  <Mail className="h-4 w-4" /> {c.email}
                </a>
              )}
              {c.whatsapp && (
                <a href={whatsappLink(c.whatsapp, `Hello ${c.name ?? ""}`)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 text-forest-700 hover:underline">
                  <MessageCircle className="h-4 w-4" /> WhatsApp {c.whatsapp}
                </a>
              )}
              {c.phone && (
                <a href={`tel:${c.phone}`} className="flex items-center gap-2 text-forest-700 hover:underline">
                  <Phone className="h-4 w-4" /> {c.phone}
                </a>
              )}
            </div>
          </Card>
        </div>
      </div>
      <ConfirmDialog
        open={deleting}
        title="Delete record?"
        message="This cannot be undone."
        loading={busy}
        onCancel={() => setDeleting(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.del(`${endpoint}/${id}`);
            toast.success("Deleted");
            await qc.invalidateQueries({ queryKey: ["crm"] });
            router.replace(listHref);
          } catch (err) {
            toast.error(errorMessage(err));
            setBusy(false);
          }
        }}
      />
    </div>
  );
}

export function Detail({ rows }: { rows: [string, ReactNode][] }) {
  return (
    <dl className="grid gap-x-6 gap-y-3 text-sm sm:grid-cols-2">
      {rows
        .filter(([, v]) => v !== undefined && v !== null && v !== "" && !(Array.isArray(v) && v.length === 0))
        .map(([k, v]) => (
          <div key={k}>
            <dt className="text-xs uppercase tracking-wide text-slate-500">{k}</dt>
            <dd className="mt-0.5 whitespace-pre-wrap text-slate-800">{v}</dd>
          </div>
        ))}
    </dl>
  );
}
