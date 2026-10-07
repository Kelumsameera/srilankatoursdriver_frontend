"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search } from "lucide-react";
import { api, errorMessage, qs } from "@/lib/admin/api";
import { formatDate } from "@/lib/utils";
import { Empty, ErrorBlock, Input, LoadingBlock, PageHeader, PaginationBar, Select } from "@/components/admin/ui";

interface Log {
  _id: string;
  userEmail: string;
  action: string;
  entity: string;
  entityId: string;
  summary: string;
  ip: string;
  timestamp: string;
}

const ACTIONS = ["login", "logout", "login_failed", "create", "update", "delete", "publish", "unpublish", "reorder", "media_upload", "media_delete", "settings_update", "password_change", "translate", "export"];

export default function ActivityPage() {
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [type, setType] = useState("");
  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["activity", page, search, type],
    queryFn: () => api.get<Log[]>(`/admin/activity-logs${qs({ page, limit: 50, search, type })}`),
  });
  return (
    <div>
      <PageHeader title="Activity Logs" description="Audit trail of sign-ins and every change made in the admin." />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="ps-9" placeholder="Search user, entity, summary…" value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} />
        </div>
        <Select className="w-48" value={type} onChange={(e) => (setType(e.target.value), setPage(1))} aria-label="Action">
          <option value="">All actions</option>
          {ACTIONS.map((a) => (
            <option key={a} value={a}>
              {a}
            </option>
          ))}
        </Select>
      </div>
      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.data.length ? (
        <Empty>No activity.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  <th className="px-4 py-3 text-start">When</th>
                  <th className="px-4 py-3 text-start">User</th>
                  <th className="px-4 py-3 text-start">Action</th>
                  <th className="px-4 py-3 text-start">Entity</th>
                  <th className="px-4 py-3 text-start">Summary</th>
                  <th className="px-4 py-3 text-start">IP</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((l) => (
                  <tr key={l._id}>
                    <td className="whitespace-nowrap px-4 py-2.5 text-slate-500">{formatDate(l.timestamp, "en", { dateStyle: "short", timeStyle: "medium" })}</td>
                    <td className="px-4 py-2.5">{l.userEmail}</td>
                    <td className="px-4 py-2.5">
                      <span className={`rounded px-1.5 py-0.5 font-mono text-xs ${l.action === "login_failed" || l.action.includes("delete") ? "bg-red-50 text-red-700" : "bg-slate-100"}`}>{l.action}</span>
                    </td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-500">
                      {l.entity}
                      {l.entityId ? ` #${l.entityId.slice(-6)}` : ""}
                    </td>
                    <td className="px-4 py-2.5">{l.summary}</td>
                    <td className="px-4 py-2.5 font-mono text-xs text-slate-400">{l.ip}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta && <PaginationBar page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
        </div>
      )}
    </div>
  );
}
