"use client";

import { Suspense, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Lock, RefreshCw, Sparkles, Unlock } from "lucide-react";
import { api, errorMessage, qs } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import { Button, Card, Empty, ErrorBlock, Label, LoadingBlock, PageHeader, Select, StatusBadge, Switch, Textarea } from "@/components/admin/ui";

interface EntityTranslations {
  source: Record<string, string>;
  locales: Record<string, { state: string; fields: Record<string, string>; locked: boolean; published: boolean; origin: string | null; translatedAt: string | null }>;
}
interface Overview {
  configured: boolean;
  locales: { code: string; name: string; nativeName: string; rtl?: boolean }[];
  entityTypes: { key: string; label: string }[];
  groups: { items: { entityId: string; title: string }[] }[];
}

function Editor() {
  const params = useSearchParams();
  const router = useRouter();
  const qc = useQueryClient();
  const { can } = useAuth();
  const type = params.get("type") ?? "tour";
  const id = params.get("id") ?? "";
  const [locale, setLocale] = useState(params.get("locale") ?? "de");
  const [draftState, setDraftState] = useState<{ key: string; values: Record<string, string> }>({ key: "", values: {} });
  const [busy, setBusy] = useState(false);

  const overview = useQuery({ queryKey: ["translations", type], queryFn: () => api.get<Overview>(`/admin/translations${qs({ type })}`) });
  const entity = useQuery({
    queryKey: ["translation-entity", type, id],
    queryFn: () => api.get<EntityTranslations>(`/admin/translations/${type}/${id}`),
    enabled: !!id,
  });
  const current = entity.data?.data.locales[locale];
  // Draft edits belong to one (item, language, saved version); switching resets to the stored translation.
  const draftKey = `${id}|${locale}|${current?.translatedAt ?? ""}|${current?.state ?? ""}`;
  const draft = draftState.key === draftKey ? draftState.values : (current?.fields ?? {});
  const setDraft = (fn: (d: Record<string, string>) => Record<string, string>) => setDraftState({ key: draftKey, values: fn(draft) });

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(k, v);
    if (k === "type") next.delete("id");
    router.replace(`?${next.toString()}`);
  };

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

  const o = overview.data?.data;
  const meta = o?.locales.find((l) => l.code === locale);
  const editable = can("translations:update");
  const source = useMemo(() => entity.data?.data.source ?? {}, [entity.data]);
  const paths = useMemo(() => Object.keys(source), [source]);

  return (
    <div>
      <PageHeader title="Content Translation" description="Edit translations side-by-side with the English source. Locked translations are never overwritten by machine translation." />
      <div className="mb-4 grid gap-3 sm:grid-cols-3">
        <div>
          <Label htmlFor="tr-type">Content type</Label>
          <Select id="tr-type" value={type} onChange={(e) => setParam("type", e.target.value)}>
            {o?.entityTypes.map((t) => (
              <option key={t.key} value={t.key}>
                {t.label}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tr-item">Item</Label>
          <Select id="tr-item" value={id} onChange={(e) => setParam("id", e.target.value)}>
            <option value="">— choose —</option>
            {o?.groups[0]?.items.map((i) => (
              <option key={i.entityId} value={i.entityId}>
                {i.title}
              </option>
            ))}
          </Select>
        </div>
        <div>
          <Label htmlFor="tr-locale">Language</Label>
          <Select id="tr-locale" value={locale} onChange={(e) => setLocale(e.target.value)}>
            {o?.locales.map((l) => (
              <option key={l.code} value={l.code}>
                {l.name} ({l.nativeName}) – {entity.data?.data.locales[l.code]?.state.replace("_", " ") ?? ""}
              </option>
            ))}
          </Select>
        </div>
      </div>

      {!id ? (
        <Empty>Choose an item to translate.</Empty>
      ) : entity.isLoading ? (
        <LoadingBlock />
      ) : entity.error ? (
        <ErrorBlock message={errorMessage(entity.error)} />
      ) : (
        <div className="grid gap-6 xl:grid-cols-[1fr_300px]">
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
                        <p className="mb-1 text-[11px] text-slate-400">{meta?.nativeName}</p>
                        <Textarea
                          dir={meta?.rtl ? "rtl" : "ltr"}
                          lang={locale}
                          className={cn(!long && "min-h-10")}
                          rows={long ? 5 : 1}
                          value={draft[path] ?? ""}
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
                      loading={busy}
                      onClick={() => run(() => api.post("/admin/translations/generate", { entityType: type, entityId: id, locales: [locale] }), "Translated missing / outdated fields")}
                    >
                      <Sparkles className="h-4 w-4" /> Generate
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
                      <Switch
                        checked={current ? current.published : false}
                        onChange={(v) => run(() => api.put(`/admin/translations/${type}/${id}/${locale}`, { published: v }), v ? "Published" : "Unpublished")}
                      />
                    </div>
                  </>
                )}
              </div>
            </Card>
            {editable && o?.configured && (
              <Button
                variant="secondary"
                className="w-full"
                loading={busy}
                onClick={() => run(() => api.post("/admin/translations/generate", { entityType: type, entityId: id }), "Generated all languages")}
              >
                <Sparkles className="h-4 w-4" /> Generate all 13 languages
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function TranslationEditorPage() {
  return (
    <Suspense fallback={<LoadingBlock />}>
      <Editor />
    </Suspense>
  );
}
