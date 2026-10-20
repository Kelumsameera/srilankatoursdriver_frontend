"use client";

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { RotateCcw, Search } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { bundledMessages } from "@/lib/admin/messages";
import { cn } from "@/lib/utils";
import { Button, Card, Empty, ErrorBlock, Input, Label, LoadingBlock, PageHeader, PaginationBar, Select, Textarea } from "@/components/admin/ui";

interface Lang {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  rtl?: boolean;
}

type Filter = "all" | "missing" | "overridden";
const PER_PAGE = 40;

/** Placeholders like {count} or {name} must stay balanced, otherwise the website cannot format the text. */
function bracesOk(text: string) {
  let depth = 0;
  for (const ch of text) {
    if (ch === "{") depth++;
    if (ch === "}" && --depth < 0) return false;
  }
  return depth === 0;
}

/** Admin → Translations → UI Texts: override the website's built-in texts (menus, buttons, labels) per language. */
export default function UiTextsPage() {
  const { can } = useAuth();
  const t = useTranslations("uiTexts");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const editable = can("translations:update");
  const [locale, setLocale] = useState("si");
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState<Filter>("all");
  const [page, setPage] = useState(1);
  const [draftState, setDraftState] = useState<{ locale: string; values: Record<string, string> }>({ locale: "", values: {} });
  const [saving, setSaving] = useState(false);

  const languages = useQuery({ queryKey: ["languages"], queryFn: () => api.get<Lang[]>("/admin/languages") });
  const english = useQuery({ queryKey: ["bundled-messages", "en"], queryFn: () => bundledMessages("en"), staleTime: Infinity });
  const bundled = useQuery({ queryKey: ["bundled-messages", locale], queryFn: () => bundledMessages(locale), staleTime: Infinity });
  const overrides = useQuery({ queryKey: ["ui-messages", locale], queryFn: () => api.get<Record<string, string>>(`/admin/ui-messages/${locale}`) });

  // Unsaved edits belong to one language; switching language starts clean.
  const draft = draftState.locale === locale ? draftState.values : {};
  const saved = useMemo(() => overrides.data?.data ?? {}, [overrides.data]);
  const valueOf = (key: string) => (key in draft ? draft[key] : (saved[key] ?? ""));
  const changed = Object.keys(draft).filter((k) => draft[k] !== (saved[k] ?? ""));
  const invalid = changed.filter((k) => !bracesOk(draft[k]));

  const rows = useMemo(() => {
    const en = english.data ?? {};
    const own = bundled.data ?? {};
    const q = search.trim().toLowerCase();
    return Object.keys(en)
      .filter((key) => filter === "all" || (filter === "missing" ? !(key in own) && !saved[key] : !!saved[key]))
      .filter((key) => !q || key.toLowerCase().includes(q) || en[key].toLowerCase().includes(q) || (own[key] ?? "").toLowerCase().includes(q) || (saved[key] ?? "").toLowerCase().includes(q));
  }, [english.data, bundled.data, saved, search, filter]);

  if (languages.isLoading || english.isLoading) return <LoadingBlock />;
  if (languages.error || english.error) return <ErrorBlock message={errorMessage(languages.error ?? english.error)} onRetry={() => void languages.refetch()} />;

  const langs = (languages.data?.data ?? []).filter((l) => l.enabled);
  const meta = langs.find((l) => l.code === locale);
  const en = english.data ?? {};
  const own = bundled.data ?? {};
  const totalPages = Math.max(1, Math.ceil(rows.length / PER_PAGE));
  const current = Math.min(page, totalPages);
  const missingCount = Object.keys(en).filter((k) => !(k in own) && !saved[k]).length;

  const edit = (key: string, value: string) => setDraftState({ locale, values: { ...draft, [key]: value } });

  const save = async () => {
    setSaving(true);
    try {
      await api.put(`/admin/ui-messages/${locale}`, { messages: Object.fromEntries(changed.map((k) => [k, draft[k]])) });
      await qc.invalidateQueries({ queryKey: ["ui-messages", locale] });
      setDraftState({ locale: "", values: {} });
      toast.success(t("saved"));
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <PageHeader
        title={t("title")}
        description={t("description")}
        actions={
          editable && (
            <Button onClick={save} loading={saving} disabled={changed.length === 0 || invalid.length > 0}>
              {changed.length > 0 ? t("saveCount", { count: changed.length }) : tc("save")}
            </Button>
          )
        }
      />

      {/* Filters */}
      <Card className="mb-4">
        <div className="grid gap-3 md:grid-cols-[200px_1fr_auto]">
          <div>
            <Label htmlFor="ui-locale">{t("language")}</Label>
            <Select
              id="ui-locale"
              value={locale}
              onChange={(e) => {
                setLocale(e.target.value);
                setPage(1);
              }}
            >
              {langs.map((l) => (
                <option key={l.code} value={l.code}>
                  {l.name} ({l.nativeName})
                </option>
              ))}
            </Select>
          </div>
          <div>
            <Label htmlFor="ui-search">{t("search")}</Label>
            <div className="relative">
              <Search className="pointer-events-none absolute start-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden />
              <Input
                id="ui-search"
                className="ps-9"
                placeholder={t("searchPlaceholder")}
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value);
                  setPage(1);
                }}
              />
            </div>
          </div>
          <div>
            <Label htmlFor="ui-filter">{t("show")}</Label>
            <Select
              id="ui-filter"
              value={filter}
              onChange={(e) => {
                setFilter(e.target.value as Filter);
                setPage(1);
              }}
            >
              <option value="all">{t("all")}</option>
              <option value="missing">{t("missing", { count: missingCount })}</option>
              <option value="overridden">{t("overridden", { count: Object.keys(saved).length })}</option>
            </Select>
          </div>
        </div>
      </Card>

      {/* Texts */}
      {bundled.isLoading || overrides.isLoading ? (
        <LoadingBlock />
      ) : rows.length === 0 ? (
        <Empty>{filter === "missing" ? t("emptyMissing") : t("emptySearch")}</Empty>
      ) : (
        <Card>
          <ul className="divide-y divide-slate-100">
            {rows.slice((current - 1) * PER_PAGE, current * PER_PAGE).map((key) => {
              const value = valueOf(key);
              const isMissing = !(key in own);
              const bad = !!value && !bracesOk(value);
              return (
                <li key={key} className="grid gap-3 py-3 md:grid-cols-2">
                  <div className="min-w-0">
                    <p className="flex items-center gap-2 font-mono text-[11px] text-slate-400">
                      {key}
                      {isMissing && !saved[key] && <span className="rounded bg-amber-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-amber-700 ring-1 ring-amber-600/20">{t("missingBadge")}</span>}
                      {saved[key] && <span className="rounded bg-sky-50 px-1.5 py-0.5 font-sans text-[10px] font-medium text-sky-700 ring-1 ring-sky-600/20">{t("overriddenBadge")}</span>}
                    </p>
                    <p className="mt-1 text-sm text-slate-700">{en[key]}</p>
                  </div>
                  <div>
                    <div className="flex items-start gap-2">
                      <Textarea
                        lang={locale}
                        dir={meta?.rtl ? "rtl" : "ltr"}
                        rows={en[key].length > 70 ? 3 : 1}
                        className={cn("min-h-10", key in draft && draft[key] !== (saved[key] ?? "") && "border-amber-400")}
                        placeholder={own[key] ?? en[key]}
                        value={value}
                        disabled={!editable}
                        aria-invalid={bad}
                        aria-label={`${key} (${locale})`}
                        onChange={(e) => edit(key, e.target.value)}
                      />
                      {value && editable && (
                        <button type="button" onClick={() => edit(key, "")} title={t("useBuiltIn")} aria-label={`Clear override for ${key}`} className="mt-1.5 rounded p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700">
                          <RotateCcw className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                    {bad && <p className="mt-1 text-xs text-red-600">{t("bracesError")}</p>}
                  </div>
                </li>
              );
            })}
          </ul>
          <PaginationBar page={current} totalPages={totalPages} total={rows.length} onPage={setPage} />
        </Card>
      )}
    </div>
  );
}
