"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { Button, Card, ConfirmDialog, ErrorBlock, Input, Label, LoadingBlock, PageHeader } from "@/components/admin/ui";

interface Role {
  _id: string;
  name: string;
  description: string;
  permissions: string[];
  isSystem: boolean;
  userCount: number;
}
interface Perms {
  modules: string[];
  actions: string[];
}

const pretty = (m: string) => m.replace(/([A-Z])/g, " $1").replace(/^./, (c) => c.toUpperCase());

export function PermissionMatrix({ value, onChange, readOnly, perms }: { value: string[]; onChange?: (v: string[]) => void; readOnly?: boolean; perms: Perms }) {
  const all = value.includes("*");
  const has = (p: string) => all || value.includes(p);
  const toggle = (p: string) => onChange?.(has(p) ? value.filter((x) => x !== p) : [...value, p]);
  const toggleRow = (m: string) => {
    const keys = perms.actions.map((a) => `${m}:${a}`);
    const full = keys.every(has);
    onChange?.(full ? value.filter((v) => !keys.includes(v)) : Array.from(new Set([...value, ...keys])));
  };
  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="text-xs uppercase text-slate-500">
            <th className="py-2 text-start">Module</th>
            {perms.actions.map((a) => (
              <th key={a} className="px-2 py-2 text-center">
                {a}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-slate-100">
          {perms.modules.map((m) => (
            <tr key={m}>
              <td className="py-1.5">
                <button type="button" disabled={readOnly} onClick={() => toggleRow(m)} className="text-start hover:text-forest-700 disabled:hover:text-inherit">
                  {pretty(m)}
                </button>
              </td>
              {perms.actions.map((a) => (
                <td key={a} className="px-2 py-1.5 text-center">
                  <input type="checkbox" className="accent-forest-700" checked={has(`${m}:${a}`)} disabled={readOnly || all} onChange={() => toggle(`${m}:${a}`)} aria-label={`${m}:${a}`} />
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export default function RolesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/admin/roles") });
  const perms = useQuery({ queryKey: ["permissions"], queryFn: () => api.get<Perms>("/admin/permissions") });
  const [selected, setSelected] = useState<Role | null>(null);
  const [draft, setDraft] = useState<Role | null>(null);
  const [deleting, setDeleting] = useState(false);
  const [busy, setBusy] = useState(false);

  if (roles.isLoading || perms.isLoading) return <LoadingBlock />;
  if (roles.error || perms.error) return <ErrorBlock message={errorMessage(roles.error ?? perms.error)} />;
  const list = roles.data!.data;
  const active = draft ?? selected ?? list[0];
  const readOnly = !can(active?._id ? "roles:update" : "roles:create") || active?.permissions.includes("*");

  const save = async () => {
    if (!draft) return;
    setBusy(true);
    try {
      const body = { name: draft.name, description: draft.description, permissions: draft.permissions };
      const res = draft._id ? await api.put<Role>(`/admin/roles/${draft._id}`, body) : await api.post<Role>("/admin/roles", body);
      toast.success("Role saved – applies on the users' next request");
      await qc.invalidateQueries({ queryKey: ["roles"] });
      setSelected(res.data);
      setDraft(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Roles"
        description="Each role grants permissions per module. The API enforces them on every request."
        actions={
          can("roles:create") && (
            <Button onClick={() => setDraft({ _id: "", name: "New role", description: "", permissions: ["dashboard:read"], isSystem: false, userCount: 0 })}>
              <Plus className="h-4 w-4" /> New role
            </Button>
          )
        }
      />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <Card>
          <ul className="space-y-1">
            {list.map((r) => (
              <li key={r._id}>
                <button
                  type="button"
                  onClick={() => {
                    setDraft(null);
                    setSelected(r);
                  }}
                  className={`w-full rounded-lg px-3 py-2 text-start text-sm ${active?._id === r._id ? "bg-forest-50 text-forest-800" : "hover:bg-slate-50"}`}
                >
                  <span className="flex items-center gap-1 font-medium">
                    {r.isSystem && <Lock className="h-3 w-3 text-slate-400" />} {r.name}
                  </span>
                  <span className="text-xs text-slate-500">{r.userCount} users</span>
                </button>
              </li>
            ))}
          </ul>
        </Card>
        {active && (
          <Card
            title={draft?._id === "" ? "New role" : active.name}
            actions={
              !readOnly && (
                <div className="flex gap-2">
                  {active._id && !active.isSystem && can("roles:delete") && (
                    <Button variant="outline" size="sm" onClick={() => setDeleting(true)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  )}
                  <Button size="sm" onClick={save} loading={busy} disabled={!draft}>
                    Save
                  </Button>
                </div>
              )
            }
          >
            {active.permissions.includes("*") ? (
              <p className="mb-4 rounded-lg bg-amber-50 p-3 text-sm text-amber-800">The Super Admin role has every permission and cannot be edited.</p>
            ) : null}
            <div className="mb-4 grid gap-3 sm:grid-cols-2">
              <div>
                <Label htmlFor="r-name">Name</Label>
                <Input id="r-name" value={active.name} disabled={readOnly || active.isSystem} onChange={(e) => setDraft({ ...active, name: e.target.value })} />
              </div>
              <div>
                <Label htmlFor="r-desc">Description</Label>
                <Input id="r-desc" value={active.description} disabled={readOnly} onChange={(e) => setDraft({ ...active, description: e.target.value })} />
              </div>
            </div>
            <PermissionMatrix perms={perms.data!.data} value={active.permissions} readOnly={readOnly} onChange={(p) => setDraft({ ...active, permissions: p })} />
          </Card>
        )}
      </div>
      <ConfirmDialog
        open={deleting}
        title="Delete role?"
        message="Only roles without users can be deleted."
        loading={busy}
        onCancel={() => setDeleting(false)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.del(`/admin/roles/${active!._id}`);
            toast.success("Role deleted");
            setSelected(null);
            await qc.invalidateQueries({ queryKey: ["roles"] });
          } catch (err) {
            toast.error(errorMessage(err));
          } finally {
            setBusy(false);
            setDeleting(false);
          }
        }}
      />
    </div>
  );
}
