"use client";

import { useState, type KeyboardEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { toast } from "sonner";
import { Download, Search } from "lucide-react";
import { api, downloadFile, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn, formatDate } from "@/lib/utils";
import { Button, Empty, ErrorBlock, Input, LoadingBlock, PageHeader, PaginationBar, Select, StatusBadge } from "./ui";

type Row = Record<string, unknown> & { _id: string; status: string; createdAt: string };

interface Props {
  title: string;
  description: string;
  endpoint: string;
  detailBase: string;
  permission: string;
  statuses: string[];
  columns: { label: string; render: (row: Row) => ReactNode }[];
  exportName?: string;
  typeFilter?: { value: string; label: string }[];
  onRowClick?: (row: Row) => void;
}

/** CRM inbox: status tabs with counts, search, date range, assignee, sort and CSV export. */
export function CrmList({ title, description, endpoint, detailBase, permission, statuses, columns, exportName, typeFilter, onRowClick }: Props) {
  const params = useSearchParams();
  const router = useRouter();
  const { can, user } = useAuth();
  const status = params.get("status") ?? "";
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [sort, setSort] = useState("-createdAt");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [mine, setMine] = useState(false);
  const [type, setType] = useState("");

  const query = { page, limit: 25, search, status, sort, from, to: to ? `${to}T23:59:59` : "", assignedTo: mine ? user?.id : "", type };
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["crm", endpoint, query], queryFn: () => api.get<Row[]>(`${endpoint}${qs(query)}`) });
  const counts = data?.statusCounts ?? {};
  const total = Object.values(counts).reduce((a, b) => a + b, 0);
  const setStatus = (s: string) => {
    setPage(1);
    router.push(s ? `?status=${s}` : "?");
  };

  return (
    <div>
      <PageHeader
        title={title}
        description={description}
        actions={
          exportName && (
            <Button
              variant="outline"
              onClick={() => downloadFile(`${endpoint}/export${qs({ status, search, from, to })}`, `${exportName}-${new Date().toISOString().slice(0, 10)}.csv`).catch((e) => toast.error(errorMessage(e)))}
            >
              <Download className="h-4 w-4" /> Export CSV
            </Button>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-1 border-b border-slate-200">
        {["", ...statuses].map((s) => (
          <button
            key={s || "all"}
            type="button"
            onClick={() => setStatus(s)}
            aria-pressed={status === s}
            className={cn("-mb-px border-b-2 px-3 py-2 text-sm font-medium capitalize", status === s ? "border-forest-700 text-forest-800" : "border-transparent text-slate-500 hover:text-slate-800")}
          >
            {s || "All"} <span className="ms-1 rounded-full bg-slate-100 px-1.5 text-xs text-slate-600">{s ? (counts[s] ?? 0) : total}</span>
          </button>
        ))}
      </div>
      <div className="mb-4 flex flex-wrap items-center gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input className="ps-9" placeholder="Search name, email, phone, reference…" aria-label="Search" value={search} onChange={(e) => (setSearch(e.target.value), setPage(1))} />
        </div>
        {typeFilter && (
          <Select className="w-40" value={type} onChange={(e) => (setType(e.target.value), setPage(1))} aria-label="Type">
            <option value="">All types</option>
            {typeFilter.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </Select>
        )}
        <Input type="date" className="w-40" value={from} onChange={(e) => (setFrom(e.target.value), setPage(1))} aria-label="From date" title="Received from" />
        <Input type="date" className="w-40" value={to} onChange={(e) => (setTo(e.target.value), setPage(1))} aria-label="To date" title="Received until" />
        <Select className="w-44" value={sort} onChange={(e) => setSort(e.target.value)} aria-label="Sort">
          <option value="-createdAt">Newest first</option>
          <option value="createdAt">Oldest first</option>
          <option value="status">Status</option>
          {endpoint.includes("bookings") && <option value="startDate">Travel date</option>}
        </Select>
        {endpoint !== "/admin/contact-messages" && (
          <label className="flex items-center gap-2 text-sm text-slate-600">
            <input type="checkbox" checked={mine} onChange={(e) => (setMine(e.target.checked), setPage(1))} className="accent-forest-700" /> Assigned to me
          </label>
        )}
      </div>
      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
      ) : !data?.data.length ? (
        <Empty>{search || status || from || to || mine || type ? "No records match these filters." : "Nothing here yet."}</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="crm-table">
              <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {columns.map((c) => (
                    <th key={c.label} className="px-4 py-3 text-start font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-start font-semibold">Status</th>
                  <th className="px-4 py-3 text-start font-semibold">Received</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {data.data.map((row) => (
                  <tr
                    key={row._id}
                    className={cn("cursor-pointer hover:bg-slate-50 focus-visible:bg-slate-50 focus-visible:outline-none", row.status === "new" && "font-medium")}
                    onClick={() => (onRowClick ? onRowClick(row) : router.push(`${detailBase}/${row._id}`))}
                    // Rows without a link cell (onRowClick) must still be reachable by keyboard.
                    {...(onRowClick
                      ? { tabIndex: 0, onKeyDown: (e: KeyboardEvent) => (e.key === "Enter" || e.key === " ") && (e.preventDefault(), onRowClick(row)) }
                      : {})}
                  >
                    {columns.map((c, i) => (
                      <td key={c.label} className="px-4 py-3">
                        {i === 0 && !onRowClick ? (
                          <Link href={`${detailBase}/${row._id}`} onClick={(e) => e.stopPropagation()} className="hover:text-forest-700">
                            {c.render(row)}
                          </Link>
                        ) : (
                          c.render(row)
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-3">
                      <StatusBadge status={row.status} />
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-slate-500">{formatDate(row.createdAt, "en", { dateStyle: "medium", timeStyle: "short" })}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data.meta && <PaginationBar page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
        </div>
      )}
      {!can(`${permission}:update`) && <p className="mt-3 text-xs text-slate-400">Read-only access.</p>}
    </div>
  );
}
