"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Pencil, Plus, Trash2 } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { formatDate } from "@/lib/utils";
import { Button, ConfirmDialog, ErrorBlock, FieldError, Input, Label, LoadingBlock, Modal, PageHeader, Select, StatusBadge } from "@/components/admin/ui";

interface UserRow {
  _id: string;
  name: string;
  email: string;
  status: string;
  role?: { _id: string; name: string };
  lastLoginAt?: string;
}
interface Role {
  _id: string;
  name: string;
}

export default function UsersPage() {
  const { can, user: me } = useAuth();
  const qc = useQueryClient();
  const users = useQuery({ queryKey: ["users"], queryFn: () => api.get<UserRow[]>("/admin/users?limit=100") });
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/admin/roles"), enabled: can("roles:read") });
  const [editing, setEditing] = useState<Partial<UserRow> & { password?: string; roleId?: string } | null>(null);
  const [deleting, setDeleting] = useState<UserRow | null>(null);
  const [busy, setBusy] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  if (users.isLoading) return <LoadingBlock />;
  if (users.error) return <ErrorBlock message={errorMessage(users.error)} onRetry={() => users.refetch()} />;

  const save = async () => {
    if (!editing) return;
    setBusy(true);
    setErrors({});
    try {
      const body: Record<string, unknown> = { name: editing.name, email: editing.email, role: editing.roleId, status: editing.status };
      if (editing.password) body.password = editing.password;
      if (editing._id) await api.put(`/admin/users/${editing._id}`, body);
      else await api.post("/admin/users", body);
      toast.success(editing._id ? "User saved" : "User created");
      setEditing(null);
      await qc.invalidateQueries({ queryKey: ["users"] });
    } catch (err) {
      const e = err as { errors?: { path: string; message: string }[] };
      setErrors(Object.fromEntries((e.errors ?? []).map((x) => [x.path, x.message])));
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Admin Users"
        description="People who can sign in to this admin. Passwords are hashed with bcrypt; changing a role or password signs the user out everywhere."
        actions={
          can("users:create") && (
            <Button onClick={() => setEditing({ status: "active", roleId: roles.data?.data.find((r) => r.name === "Editor")?._id })}>
              <Plus className="h-4 w-4" /> Add user
            </Button>
          )
        }
      />
      <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
        <table className="w-full text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
            <tr>
              <th className="px-4 py-3 text-start">Name</th>
              <th className="px-4 py-3 text-start">Email</th>
              <th className="px-4 py-3 text-start">Role</th>
              <th className="px-4 py-3 text-start">Status</th>
              <th className="px-4 py-3 text-start">Last login</th>
              <th />
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {users.data?.data.map((u) => (
              <tr key={u._id}>
                <td className="px-4 py-3 font-medium">
                  {u.name} {u._id === me?.id && <span className="text-xs text-slate-400">(you)</span>}
                </td>
                <td className="px-4 py-3">{u.email}</td>
                <td className="px-4 py-3">{u.role?.name}</td>
                <td className="px-4 py-3">
                  <StatusBadge status={u.status} />
                </td>
                <td className="px-4 py-3 text-slate-500">{u.lastLoginAt ? formatDate(u.lastLoginAt, "en", { dateStyle: "medium", timeStyle: "short" }) : "—"}</td>
                <td className="px-4 py-3 text-end">
                  {can("users:update") && (
                    <Button variant="ghost" size="sm" aria-label="Edit" onClick={() => setEditing({ ...u, roleId: u.role?._id })}>
                      <Pencil className="h-3.5 w-3.5" />
                    </Button>
                  )}
                  {can("users:delete") && u._id !== me?.id && (
                    <Button variant="ghost" size="sm" aria-label="Delete" onClick={() => setDeleting(u)}>
                      <Trash2 className="h-3.5 w-3.5 text-red-600" />
                    </Button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <Modal
        open={!!editing}
        onClose={() => setEditing(null)}
        title={editing?._id ? "Edit user" : "Add user"}
        footer={
          <>
            <Button variant="outline" onClick={() => setEditing(null)}>
              Cancel
            </Button>
            <Button onClick={save} loading={busy}>
              Save
            </Button>
          </>
        }
      >
        {editing && (
          <div className="space-y-4">
            <div>
              <Label htmlFor="u-name" required>
                Name
              </Label>
              <Input id="u-name" value={editing.name ?? ""} onChange={(e) => setEditing({ ...editing, name: e.target.value })} />
              <FieldError message={errors.name} />
            </div>
            <div>
              <Label htmlFor="u-email" required>
                Email
              </Label>
              <Input id="u-email" type="email" value={editing.email ?? ""} onChange={(e) => setEditing({ ...editing, email: e.target.value })} />
              <FieldError message={errors.email} />
            </div>
            <div>
              <Label htmlFor="u-pass" required={!editing._id} hint={editing._id ? "leave empty to keep" : "min 10 chars, upper, lower, number"}>
                Password
              </Label>
              <Input id="u-pass" type="password" autoComplete="new-password" value={editing.password ?? ""} onChange={(e) => setEditing({ ...editing, password: e.target.value })} />
              <FieldError message={errors.password} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <Label htmlFor="u-role" required>
                  Role
                </Label>
                <Select id="u-role" value={editing.roleId ?? ""} onChange={(e) => setEditing({ ...editing, roleId: e.target.value })}>
                  <option value="">Choose…</option>
                  {roles.data?.data.map((r) => (
                    <option key={r._id} value={r._id}>
                      {r.name}
                    </option>
                  ))}
                </Select>
                <FieldError message={errors.role} />
              </div>
              <div>
                <Label htmlFor="u-status">Status</Label>
                <Select id="u-status" value={editing.status ?? "active"} onChange={(e) => setEditing({ ...editing, status: e.target.value })}>
                  <option value="active">Active</option>
                  <option value="suspended">Suspended</option>
                </Select>
              </div>
            </div>
          </div>
        )}
      </Modal>
      <ConfirmDialog
        open={!!deleting}
        title="Delete user?"
        message={`${deleting?.name} (${deleting?.email}) will lose access immediately.`}
        loading={busy}
        onCancel={() => setDeleting(null)}
        onConfirm={async () => {
          setBusy(true);
          try {
            await api.del(`/admin/users/${deleting!._id}`);
            toast.success("User deleted");
            await qc.invalidateQueries({ queryKey: ["users"] });
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
