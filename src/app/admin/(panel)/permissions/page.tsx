"use client";

import { useQuery } from "@tanstack/react-query";
import { api, errorMessage } from "@/lib/admin/api";
import { Card, ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/ui";

interface Role {
  _id: string;
  name: string;
  permissions: string[];
}

/** Read-only overview: which role can do what. */
export default function PermissionsPage() {
  const roles = useQuery({ queryKey: ["roles"], queryFn: () => api.get<Role[]>("/admin/roles") });
  const perms = useQuery({ queryKey: ["permissions"], queryFn: () => api.get<{ modules: string[]; actions: string[] }>("/admin/permissions") });
  if (roles.isLoading || perms.isLoading) return <LoadingBlock />;
  if (roles.error || perms.error) return <ErrorBlock message={errorMessage(roles.error ?? perms.error)} onRetry={() => void Promise.all([roles.refetch(), perms.refetch()])} />;
  const { modules, actions } = perms.data!.data;
  const list = roles.data!.data;
  const letter = (role: Role, m: string) =>
    actions
      .filter((a) => role.permissions.includes("*") || role.permissions.includes(`${m}:${a}`))
      .map((a) => a[0].toUpperCase())
      .join("");
  return (
    <div>
      <PageHeader title="Permissions" description="C = create, R = read, U = update, D = delete. Edit role permissions in Users → Roles." />
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="py-2 text-start">Module</th>
                {list.map((r) => (
                  <th key={r._id} className="px-3 py-2 text-center">
                    {r.name}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {modules.map((m) => (
                <tr key={m}>
                  <td className="py-1.5 font-mono text-xs">{m}</td>
                  {list.map((r) => (
                    <td key={r._id} className="px-3 py-1.5 text-center font-mono text-xs text-forest-700">
                      {letter(r, m) || <span className="text-slate-300">—</span>}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
