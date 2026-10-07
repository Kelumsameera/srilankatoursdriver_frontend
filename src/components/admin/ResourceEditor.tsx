"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { ArrowLeft, ExternalLink, Languages } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import type { AdminResource } from "@/features/admin/resources";
import { EntityForm } from "./form/EntityForm";
import { Card, ErrorBlock, LoadingBlock, PageHeader, StatusBadge } from "./ui";
import { formatDate } from "@/lib/utils";

type Row = Record<string, unknown> & { _id: string };

export function ResourceEditor({ resource, id }: { resource: AdminResource; id: string }) {
  const router = useRouter();
  const qc = useQueryClient();
  const { can } = useAuth();
  const isNew = id === "new";
  const base = `/admin/content/${resource.key}`;
  const p = resource.permission;

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ["item", resource.key, id],
    queryFn: () => api.get<Row>(`${resource.endpoint}/${id}`),
    enabled: !isNew,
  });

  if (!isNew && isLoading) return <LoadingBlock />;
  if (!isNew && error) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;

  const item = isNew ? { ...resource.defaults, ...resource.fixedValues } : data?.data;
  const title = isNew ? `New ${resource.singular.toLowerCase()}` : String(item?.[resource.titleKey] ?? resource.singular);
  const publicPath = !isNew && item ? resource.publicPath?.(item) : null;

  const save = async (payload: Record<string, unknown>) => {
    const body = { ...payload, ...resource.fixedValues };
    if (isNew) {
      const res = await api.post<Row>(resource.endpoint, body);
      toast.success(`${resource.singular} created`);
      await qc.invalidateQueries({ queryKey: ["list", resource.key] });
      router.replace(`${base}/${res.data._id}`);
    } else {
      await api.put<Row>(`${resource.endpoint}/${id}`, body);
      toast.success("Saved – the website updates automatically");
      await qc.invalidateQueries({ queryKey: ["list", resource.key] });
      await qc.invalidateQueries({ queryKey: ["item", resource.key, id] });
    }
  };

  return (
    <div>
      <Link href={base} className="mb-3 inline-flex items-center gap-1 text-sm text-slate-500 hover:text-slate-800">
        <ArrowLeft className="h-4 w-4" /> {resource.title}
      </Link>
      <PageHeader
        title={title}
        actions={
          <>
            {publicPath && (
              <a href={publicPath} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50">
                <ExternalLink className="h-4 w-4" /> View on website
              </a>
            )}
            {!isNew && resource.translationType && can("translations:read") && (
              <Link
                href={`/admin/translations/editor?type=${resource.translationType}&id=${id}`}
                className="inline-flex items-center gap-1 rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-700 hover:bg-slate-50"
              >
                <Languages className="h-4 w-4" /> Translations
              </Link>
            )}
          </>
        }
      />
      <EntityForm
        sections={resource.sections}
        initial={item}
        onSubmit={save}
        readOnly={!can(isNew ? `${p}:create` : `${p}:update`)}
        submitLabel={isNew ? `Create ${resource.singular.toLowerCase()}` : "Save changes"}
        aside={
          !isNew && item ? (
            <Card title="Info">
              <dl className="space-y-2 text-sm">
                {resource.statusField && (
                  <div className="flex justify-between">
                    <dt className="text-slate-500">Status</dt>
                    <dd>
                      <StatusBadge status={resource.statusField === "enabled" ? Boolean(item.enabled) : (item.status as string)} />
                    </dd>
                  </div>
                )}
                {typeof item.slug === "string" && (
                  <div className="flex justify-between gap-2">
                    <dt className="text-slate-500">Slug</dt>
                    <dd className="truncate font-mono text-xs">{item.slug}</dd>
                  </div>
                )}
                <div className="flex justify-between">
                  <dt className="text-slate-500">Created</dt>
                  <dd>{formatDate(item.createdAt as string)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-slate-500">Updated</dt>
                  <dd>{formatDate(item.updatedAt as string, "en", { dateStyle: "medium", timeStyle: "short" })}</dd>
                </div>
              </dl>
            </Card>
          ) : null
        }
      />
    </div>
  );
}
