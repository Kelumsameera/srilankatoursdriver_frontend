"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, RefreshCw, Sparkles, Unlock } from "lucide-react";
import { api, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import { Button, Card, ErrorBlock, LoadingBlock, StatusBadge, Switch, Textarea } from "./ui";

export type TranslationState = "missing" | "outdated" | "failed" | "up_to_date";

export interface EntityTranslations {
  source: Record<string, string>;
  locales: Record<string, { state: TranslationState; fields: Record<string, string>; locked: boolean; published: boolean; origin: string | null; translatedAt: string | null }>;
}
export interface TranslationOverview {
  configured: boolean;
  locales: { code: string; name: string; nativeName: string; rtl?: boolean }[];
  entityTypes: { key: string; label: string }[];
  groups: { items: { entityId: string; title: string }[] }[];
}

/** Dot colour for a translation state (status page, editor and the language tabs in content forms). */
export const STATE_DOT: Record<TranslationState, string> = { up_to_date: "bg-emerald-500", outdated: "bg-amber-400", failed: "bg-red-500", missing: "bg-slate-300" };

export const entityTranslationsQuery = (type: string, id: string) => ({
  queryKey: ["translation-entity", type, id],
  queryFn: () => api.get<EntityTranslations>(`/admin/translations/${type}/${id}`),
});
export const translationOverviewQuery = (type: string) => ({
  queryKey: ["translations", type],
  queryFn: () => api.get<TranslationOverview>(`/admin/translations${qs({ type })}`),
});

/**
 * Side-by-side translation of one item into one language: English source on the left, editable translation on the right,
 * plus save / auto-translate / lock / publish. Used by Content Translation and by the language tabs of content forms.
 */
export function TranslationPanel({ type, id, locale }: { type: string; id: string; locale: string }) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const [draftState, setDraftState] = useState<{ key: string; values: Record<string, string> }>({ key: "", values: {} });
  const [busy, setBusy] = useState(false);

  const overview = useQuery(translationOverviewQuery(type));
  const entity = useQuery({ ...entityTranslationsQuery(type, id), enabled: !!id });
  const current = entity.data?.data.locales[locale];
  // Draft edits belong to one (item, language, saved version); switching resets to the stored translation.
  const draftKey = `${id}|${locale}|${current?.translatedAt ?? ""}|${current?.state ?? ""}`;
  const draft = draftState.key === draftKey ? draftState.values : (current?.fields ?? {});
  const setDraft = (fn: (d: Record<string, string>) => Record<string, string>) => setDraftState({ key: draftKey, values: fn(draft) });
  const source = useMemo(() => entity.data?.data.source ?? {}, [entity.data]);
  const paths = useMemo(() => Object.keys(source), [source]);

  const refresh = async () => {
    await qc.invalidateQueries({ queryKey: ["translation-entity", type, id] });
    await qc.invalidateQueries({ queryKey: ["translations"] });
  };

  const run = async (fn: () => Promise<unknown>, msg: string) => {
    setBusy(true);
    try {
      await fn();
      toast.success(msg);
      await refresh();
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  if (entity.isLoading) return <LoadingBlock />;
  if (entity.error) return <ErrorBlock message={errorMessage(entity.error)} onRetry={() => void entity.refetch()} />;

  const o = overview.data?.data;
  const meta = o?.locales.find((l) => l.code === locale);
  const editable = can("translations:update");
  const otherLocales = o?.locales.length ?? 0;

  return (
    <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1fr_300px]">
      <Card title={`English → ${meta?.name ?? locale}`}>
        {paths.length === 0 ? (
          <p className="text-sm text-slate-500">This item has no translatable text yet.</p>
        ) : (
          <div className="space-y-5">
            {paths.map((path) => {
              const long = source[path].length > 80 || source[path].includes("\n");
              return (
                <div key={path} className="grid gap-3 md:grid-cols-2">
                  <div>
                    <p className="mb-1 font-mono text-[11px] text-slate-400">{path}</p>
                    <p className="whitespace-pre-wrap rounded-lg bg-slate-50 p-2.5 text-sm text-slate-700">{source[path]}</p>
                  </div>
                  <div>
                    <p className="mb-1 flex items-center gap-2 text-[11px] text-slate-400">
                      {meta?.nativeName}
                      {!draft[path] && <span className="rounded bg-amber-50 px-1.5 text-[10px] font-medium text-amber-700">missing – shows English</span>}
                    </p>
                    <Textarea
                      dir={meta?.rtl ? "rtl" : "ltr"}
                      lang={locale}
                      className={cn(!long && "min-h-10")}
                      rows={long ? 5 : 1}
                      value={draft[path] ?? ""}
                      placeholder={source[path]}
                      disabled={!editable}
                      onChange={(e) => setDraft((d) => ({ ...d, [path]: e.target.value }))}
                      aria-label={`${path} (${locale})`}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>
      <div className="space-y-4 xl:sticky xl:top-20 xl:self-start">
        <Card title="This language">
          <div className="space-y-4 text-sm">
            <div className="flex items-center justify-between">
              <span>Status</span>
              <StatusBadge status={current?.state} />
            </div>
            {current?.origin && <p className="text-xs text-slate-500">Origin: {current.origin}</p>}
            {editable && (
              <>
                <Button className="w-full" loading={busy} onClick={() => run(() => api.put(`/admin/translations/${type}/${id}/${locale}`, { fields: draft }), "Translation saved")} data-testid="save-translation">
                  Save translation
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!o?.configured || current?.locked}
                  title={o?.configured ? undefined : "Set up a translation provider in System → API Settings"}
                  loading={busy}
                  onClick={() => run(() => api.post("/admin/translations/generate", { entityType: type, entityId: id, locales: [locale] }), "Translated missing / outdated fields")}
                >
                  <Sparkles className="h-4 w-4" /> Auto-translate missing
                </Button>
                <Button
                  variant="outline"
                  className="w-full"
                  disabled={!o?.configured || current?.locked}
                  loading={busy}
                  onClick={() => run(() => api.post("/admin/translations/generate", { entityType: type, entityId: id, locales: [locale], force: true }), "Re-translated all fields")}
                >
                  <RefreshCw className="h-4 w-4" /> Regenerate all
                </Button>
                <div className="flex items-center justify-between border-t border-slate-100 pt-3">
                  <span className="flex items-center gap-1">{current?.locked ? <Lock className="h-4 w-4" /> : <Unlock className="h-4 w-4" />} Locked</span>
                  <Switch checked={!!current?.locked} onChange={(v) => run(() => api.put(`/admin/translations/${type}/${id}/${locale}`, { locked: v }), v ? "Locked" : "Unlocked")} />
                </div>
                <div className="flex items-center justify-between">
                  <span>Published</span>
                  <Switch checked={current ? current.published : false} onChange={(v) => run(() => api.put(`/admin/translations/${type}/${id}/${locale}`, { published: v }), v ? "Published" : "Unpublished")} />
                </div>
              </>
            )}
          </div>
        </Card>
        {editable && o?.configured && (
          <Button variant="secondary" className="w-full" loading={busy} onClick={() => run(() => api.post("/admin/translations/generate", { entityType: type, entityId: id }), "Generated all languages")}>
            <Sparkles className="h-4 w-4" /> Generate all {otherLocales} languages
          </Button>
        )}
      </div>
    </div>
  );
}
