"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { cn } from "@/lib/utils";
import { Button, Card, ErrorBlock, LoadingBlock, PageHeader, Switch } from "@/components/admin/ui";

interface Lang {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  rtl?: boolean;
  order?: number;
  isDefault?: boolean;
}

export default function LanguagesPage() {
  const { can } = useAuth();
  const t = useTranslations("languages");
  const tc = useTranslations("common");
  const qc = useQueryClient();
  const editable = can("translations:update");
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["languages"], queryFn: () => api.get<Lang[]>("/admin/languages") });
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [chosenDefault, setChosenDefault] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const rows = (data?.data ?? []).map((r) => (r.code in overrides ? { ...r, enabled: overrides[r.code] } : r));
  const savedDefault = rows.find((r) => r.isDefault)?.code ?? "en";
  const defaultCode = chosenDefault ?? savedDefault;

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;

  // Turning a language off also stops it being the default.
  const setEnabled = (code: string, enabled: boolean) => {
    setOverrides((o) => ({ ...o, [code]: enabled }));
    if (!enabled && defaultCode === code) setChosenDefault("en");
  };

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/admin/languages", { languages: rows.map((r, i) => ({ code: r.code, enabled: r.enabled, order: i })), defaultLanguage: defaultCode });
      toast.success(t("saved"));
      await qc.invalidateQueries({ queryKey: ["languages"] });
      setOverrides({});
      setChosenDefault(null);
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title={t("title")} description={t("description")} />
      <Card>
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.code} className="flex flex-wrap items-center justify-between gap-3 py-3">
              <div>
                <p className="font-medium">
                  {r.name} <span className="text-slate-500">· {r.nativeName}</span>
                </p>
                <p className="font-mono text-xs text-slate-400">
                  /{r.code} {r.rtl ? `· ${t("rtl")}` : ""}
                </p>
              </div>
              <div className="flex items-center gap-5">
                <label className={cn("inline-flex items-center gap-2 text-sm", !r.enabled && "opacity-40")}>
                  <input
                    type="radio"
                    name="defaultLanguage"
                    value={r.code}
                    checked={defaultCode === r.code}
                    disabled={!editable || !r.enabled}
                    onChange={() => setChosenDefault(r.code)}
                    className="h-4 w-4 accent-forest-700"
                  />
                  {t("default")}
                </label>
                <Switch checked={r.enabled} disabled={r.code === "en" || !editable} onChange={(v) => setEnabled(r.code, v)} label={r.enabled ? tc("enabled") : tc("disabled")} />
              </div>
            </li>
          ))}
        </ul>
        <p className="mt-4 text-xs text-slate-500">{t("help")}</p>
        {editable && (
          <Button className="mt-4" onClick={save} loading={busy}>
            {tc("save")}
          </Button>
        )}
      </Card>
    </div>
  );
}
