"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, Sparkles } from "lucide-react";
import { api, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import { Button, Card, ErrorBlock, LoadingBlock, PageHeader, Select } from "@/components/admin/ui";

type State = "missing" | "outdated" | "up_to_date";
interface Overview {
  provider: string;
  configured: boolean;
  locales: { code: string; name: string }[];
  entityTypes: { key: string; label: string }[];
  groups: {
    entityType: string;
    label: string;
    items: { entityId: string; title: string; fieldCount: number; locales: Record<string, { state: State; locked: boolean; published: boolean }> }[];
  }[];
}

const dot: Record<State, string> = { up_to_date: "bg-emerald-500", outdated: "bg-amber-400", missing: "bg-slate-200" };

export default function TranslationStatusPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const [type, setType] = useState("tour");
  const [busy, setBusy] = useState(false);
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["translations", type], queryFn: () => api.get<Overview>(`/admin/translations${qs({ type })}`) });

  if (isLoading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const o = data.data;
  const group = o.groups[0];

  const generateAll = async () => {
    setBusy(true);
    try {
      await api.post("/admin/translations/generate", { entityType: type });
      toast.success("Missing and outdated translations generated");
      await qc.invalidateQueries({ queryKey: ["translations"] });
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader
        title="Translation Status"
        description="English is the source language. Content is machine-translated on the backend, then can be edited, locked and published per language."
        actions={
          can("translations:update") && (
            <Button onClick={generateAll} loading={busy} disabled={!o.configured}>
              <Sparkles className="h-4 w-4" /> Translate all missing ({group?.label})
            </Button>
          )
        }
      />
      {!o.configured && (
        <div className="mb-4 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
          Machine translation is not configured. Set <code>TRANSLATION_PROVIDER</code> (deepl, google or libretranslate) and <code>TRANSLATION_API_KEY</code> in the backend <code>.env</code>. You can still translate manually in Content Translation.
        </div>
      )}
      <div className="mb-4 flex flex-wrap items-center gap-3">
        <Select className="w-64" value={type} onChange={(e) => setType(e.target.value)} aria-label="Content type">
          {o.entityTypes.map((t) => (
            <option key={t.key} value={t.key}>
              {t.label}
            </option>
          ))}
        </Select>
        <div className="flex gap-4 text-xs text-slate-500">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-emerald-500" /> up to date</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-amber-400" /> outdated</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded-full bg-slate-200" /> missing</span>
          <span className="flex items-center gap-1"><Lock className="h-3 w-3" /> locked</span>
        </div>
      </div>
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full text-sm" data-testid="translation-matrix">
            <thead>
              <tr className="text-xs uppercase text-slate-500">
                <th className="py-2 pe-4 text-start">Item</th>
                {o.locales.map((l) => (
                  <th key={l.code} className="px-1 py-2 text-center font-mono" title={l.name}>
                    {l.code}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {(group?.items ?? []).map((item) => (
                <tr key={item.entityId}>
                  <td className="max-w-xs py-2 pe-4">
                    <Link href={`/admin/translations/editor?type=${type}&id=${item.entityId}`} className="line-clamp-1 font-medium hover:text-forest-700">
                      {item.title}
                    </Link>
                    <span className="text-xs text-slate-400">{item.fieldCount} fields</span>
                  </td>
                  {o.locales.map((l) => {
                    const s = item.locales[l.code];
                    return (
                      <td key={l.code} className="px-1 py-2 text-center">
                        <Link href={`/admin/translations/editor?type=${type}&id=${item.entityId}&locale=${l.code}`} title={`${l.name}: ${s.state}${s.locked ? " (locked)" : ""}${s.published ? "" : " (unpublished)"}`} className="inline-flex items-center justify-center">
                          <span className={cn("h-3 w-3 rounded-full", dot[s.state], !s.published && s.state !== "missing" && "ring-2 ring-red-300")} />
                          {s.locked && <Lock className="ms-0.5 h-2.5 w-2.5 text-slate-400" />}
                        </Link>
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
