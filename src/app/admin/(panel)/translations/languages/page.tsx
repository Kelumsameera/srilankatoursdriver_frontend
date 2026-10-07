"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { Button, Card, ErrorBlock, LoadingBlock, PageHeader, Switch } from "@/components/admin/ui";

interface Lang {
  code: string;
  name: string;
  nativeName: string;
  enabled: boolean;
  rtl?: boolean;
  order?: number;
}

export default function LanguagesPage() {
  const { can } = useAuth();
  const qc = useQueryClient();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["languages"], queryFn: () => api.get<Lang[]>("/admin/languages") });
  const [overrides, setOverrides] = useState<Record<string, boolean>>({});
  const [busy, setBusy] = useState(false);
  const rows = (data?.data ?? []).map((r) => (r.code in overrides ? { ...r, enabled: overrides[r.code] } : r));

  if (isLoading) return <LoadingBlock />;
  if (error) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;

  const save = async () => {
    setBusy(true);
    try {
      await api.put("/admin/languages", { languages: rows.map((r, i) => ({ code: r.code, enabled: r.enabled, order: i })) });
      toast.success("Languages saved");
      await qc.invalidateQueries({ queryKey: ["languages"] });
      setOverrides({});
    } catch (err) {
      toast.error(errorMessage(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div>
      <PageHeader title="Languages" description="Choose which languages appear in the website's language switcher. English is the source language and is always enabled." />
      <Card>
        <ul className="divide-y divide-slate-100">
          {rows.map((r) => (
            <li key={r.code} className="flex items-center justify-between py-3">
              <div>
                <p className="font-medium">
                  {r.name} <span className="text-slate-500">· {r.nativeName}</span>
                </p>
                <p className="font-mono text-xs text-slate-400">
                  /{r.code} {r.rtl ? "· right-to-left" : ""}
                </p>
              </div>
              <Switch
                checked={r.enabled}
                disabled={r.code === "en" || !can("translations:update")}
                onChange={(v) => setOverrides((o) => ({ ...o, [r.code]: v }))}
                label={r.enabled ? "Enabled" : "Disabled"}
              />
            </li>
          ))}
        </ul>
        {can("translations:update") && (
          <Button className="mt-4" onClick={save} loading={busy}>
            Save
          </Button>
        )}
      </Card>
    </div>
  );
}
