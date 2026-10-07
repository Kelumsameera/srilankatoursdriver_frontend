"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowDown, ArrowUp, Copy, ExternalLink, Eye, EyeOff, Languages, Pencil, Plus, Search, Star, Trash2 } from "lucide-react";
import { api, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn, formatDate } from "@/lib/utils";
import type { AdminResource, Column } from "@/features/admin/resources";
import { Button, ConfirmDialog, Empty, ErrorBlock, Input, LoadingBlock, PageHeader, PaginationBar, Select, StatusBadge } from "./ui";

type Row = Record<string, unknown> & { _id: string };

function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);
}

function Cell({ col, row }: { col: Column; row: Row }) {
  const v = getPath(row, col.key);
  switch (col.kind) {
    case "image":
      return v ? (
        <span className="relative block h-10 w-14 overflow-hidden rounded bg-slate-100">
          <Image src={String(v)} alt="" fill sizes="56px" className="object-cover" />
        </span>
      ) : (
        <span className="block h-10 w-14 rounded bg-slate-100" />
      );
    case "status":
      return <StatusBadge status={v as string} />;
    case "bool":
      return v ? <span className="text-emerald-600">●</span> : <span className="text-slate-300">○</span>;
    case "date":
      return <span className="whitespace-nowrap text-slate-500">{v ? formatDate(String(v)) : "—"}</span>;
    case "price":
      return <span>{typeof v === "number" ? `${row.currency ?? ""} ${v.toLocaleString()}` : "—"}</span>;
    case "category":
      return <span className="text-slate-500">{v && typeof v === "object" ? String((v as Record<string, unknown>).name ?? (v as Record<string, unknown>).label ?? "") : v ? "↳ sub-item" : "—"}</span>;
    case "stars":
      return <span className="whitespace-nowrap text-amber-500">{"★".repeat(Number(v) || 0)}</span>;
    default:
      return <span className="line-clamp-2">{v === undefined || v === null || v === "" ? "—" : String(v)}</span>;
  }
}

/** Search / filter / sort / paginate / publish / feature / duplicate / reorder / delete – for any CMS resource. */
export function ResourceList({ resource }: { resource: AdminResource }) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [filters, setFilters] = useState<Record<string, string>>({});
  const [deleting, setDeleting] = useState<Row | null>(null);
  const p = resource.permission;
  const base = `/admin/content/${resource.key}`;

  const queryKey = ["list", resource.key, page, search, status, filters];
  const { data, isLoading, error, refetch } = useQuery({
    queryKey,
    queryFn: () =>
      api.get<Row[]>(`${resource.endpoint}${qs({ page, limit: 25, search, ...(resource.statusField === "status" ? { status } : {}), ...filters, ...resource.fixedQuery })}`),
  });
  const rows = data?.data ?? [];
  const invalidate = () => qc.invalidateQueries({ queryKey: ["list", resource.key] });

  const mutate = useMutation({
    mutationFn: async (fn: () => Promise<unknown>) => fn(),
    onSuccess: () => invalidate(),
    onError: (err) => toast.error(errorMessage(err)),
  });

  const setStatusOf = (row: Row, body: Record<string, unknown>, msg: string) =>
    mutate.mutate(async () => {
      await api.patch(`${resource.endpoint}/${row._id}/status`, body);
      toast.success(msg);
    });

  const move = (index: number, dir: -1 | 1) => {
    const other = rows[index + dir];
    const row = rows[index];
    if (!other || !row) return;
    const a = Number(row.order ?? index);
    const b = Number(other.order ?? index + dir);
    mutate.mutate(async () => {
      await api.patch(`${resource.endpoint}/reorder`, {
        items: [
          { id: row._id, order: a === b ? b + dir : b },
          { id: other._id, order: a },
        ],
      });
    });
  };

  const isPublished = (row: Row) => (resource.statusField === "enabled" ? Boolean(row.enabled) : row.status === "published");

  return (
    <div>
      <PageHeader
        title={resource.title}
        description={resource.description}
        actions={
          can(`${p}:create`) && (
            <Link href={`${base}/new`}>
              <Button data-testid="create-button">
                <Plus className="h-4 w-4" /> Add {resource.singular.toLowerCase()}
              </Button>
            </Link>
          )
        }
      />
      <div className="mb-4 flex flex-wrap gap-2">
        <div className="relative min-w-56 flex-1">
          <Search className="absolute start-3 top-2.5 h-4 w-4 text-slate-400" />
          <Input
            className="ps-9"
            placeholder={`Search ${resource.title.toLowerCase()}…`}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
          />
        </div>
        {resource.statusField === "status" && resource.statusOptions && (
          <Select className="w-40" value={status} onChange={(e) => setStatus(e.target.value)} aria-label="Status">
            <option value="">All statuses</option>
            {resource.statusOptions.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        )}
        {resource.filters?.map((f) => (
          <Select key={f.key} className="w-40" value={filters[f.key] ?? ""} onChange={(e) => setFilters((x) => ({ ...x, [f.key]: e.target.value }))} aria-label={f.label}>
            <option value="">{f.label}: all</option>
            {f.options.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        ))}
      </div>

      {isLoading ? (
        <LoadingBlock />
      ) : error ? (
        <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />
      ) : rows.length === 0 ? (
        <Empty>No {resource.title.toLowerCase()} yet.</Empty>
      ) : (
        <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
          <div className="overflow-x-auto">
            <table className="w-full text-sm" data-testid="resource-table">
              <thead className="bg-slate-50 text-start text-xs uppercase tracking-wide text-slate-500">
                <tr>
                  {resource.columns.map((c) => (
                    <th key={c.key} className="px-4 py-3 text-start font-semibold">
                      {c.label}
                    </th>
                  ))}
                  <th className="px-4 py-3 text-end font-semibold">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {rows.map((row, i) => (
                  <tr key={row._id} className="hover:bg-slate-50/60">
                    {resource.columns.map((c, ci) => (
                      <td key={c.key} className="px-4 py-2.5 align-middle">
                        {ci === (resource.columns[0].kind === "image" ? 1 : 0) ? (
                          <Link href={`${base}/${row._id}`} className="font-medium text-slate-900 hover:text-forest-700">
                            <Cell col={c} row={row} />
                          </Link>
                        ) : (
                          <Cell col={c} row={row} />
                        )}
                      </td>
                    ))}
                    <td className="px-4 py-2">
                      <div className="flex items-center justify-end gap-0.5">
                        {resource.reorderable && can(`${p}:update`) && !search && (
                          <>
                            <Button variant="ghost" size="sm" onClick={() => move(i, -1)} disabled={i === 0} aria-label="Move up">
                              <ArrowUp className="h-3.5 w-3.5" />
                            </Button>
                            <Button variant="ghost" size="sm" onClick={() => move(i, 1)} disabled={i === rows.length - 1} aria-label="Move down">
                              <ArrowDown className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                        {resource.featurable && can(`${p}:update`) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label={row.featured ? "Unfeature" : "Feature"}
                            title={row.featured ? "Unfeature" : "Feature"}
                            onClick={() => setStatusOf(row, { featured: !row.featured }, row.featured ? "Removed from featured" : "Featured")}
                          >
                            <Star className={cn("h-3.5 w-3.5", row.featured ? "fill-amber-400 text-amber-400" : "")} />
                          </Button>
                        )}
                        {resource.statusField && can(`${p}:update`) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            title={isPublished(row) ? "Unpublish / disable" : "Publish / enable"}
                            aria-label={isPublished(row) ? "Unpublish" : "Publish"}
                            onClick={() =>
                              setStatusOf(
                                row,
                                resource.statusField === "enabled"
                                  ? { enabled: !row.enabled }
                                  : { status: isPublished(row) ? (resource.key === "reviews" || resource.key === "testimonials" ? "pending" : "draft") : "published" },
                                isPublished(row) ? "Unpublished" : "Published",
                              )
                            }
                          >
                            {isPublished(row) ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                          </Button>
                        )}
                        {resource.publicPath?.(row) && (
                          <a href={resource.publicPath(row)!} target="_blank" rel="noopener noreferrer" className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="View on website">
                            <ExternalLink className="h-3.5 w-3.5" />
                          </a>
                        )}
                        {resource.translationType && can("translations:read") && (
                          <Link href={`/admin/translations/editor?type=${resource.translationType}&id=${row._id}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Translations">
                            <Languages className="h-3.5 w-3.5" />
                          </Link>
                        )}
                        {resource.duplicable && can(`${p}:create`) && (
                          <Button
                            variant="ghost"
                            size="sm"
                            aria-label="Duplicate"
                            title="Duplicate"
                            onClick={() =>
                              mutate.mutate(async () => {
                                await api.post(`${resource.endpoint}/${row._id}/duplicate`);
                                toast.success("Duplicated as draft");
                              })
                            }
                          >
                            <Copy className="h-3.5 w-3.5" />
                          </Button>
                        )}
                        <Link href={`${base}/${row._id}`} className="rounded-lg p-1.5 text-slate-500 hover:bg-slate-100" title="Edit" aria-label="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Link>
                        {can(`${p}:delete`) && (
                          <Button variant="ghost" size="sm" onClick={() => setDeleting(row)} aria-label="Delete" title="Delete">
                            <Trash2 className="h-3.5 w-3.5 text-red-600" />
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {data?.meta && <PaginationBar page={page} totalPages={data.meta.totalPages} total={data.meta.total} onPage={setPage} />}
        </div>
      )}

      <ConfirmDialog
        open={!!deleting}
        title={`Delete ${resource.singular.toLowerCase()}?`}
        message={
          <>
            <strong>{String(deleting?.[resource.titleKey] ?? "")}</strong> will be permanently deleted (including its translations).
          </>
        }
        loading={mutate.isPending}
        onCancel={() => setDeleting(null)}
        onConfirm={() =>
          mutate.mutate(
            async () => {
              await api.del(`${resource.endpoint}/${deleting!._id}`);
              toast.success("Deleted");
            },
            { onSettled: () => setDeleting(null) },
          )
        }
      />
    </div>
  );
}
