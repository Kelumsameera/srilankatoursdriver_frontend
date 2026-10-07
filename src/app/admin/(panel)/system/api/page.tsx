"use client";

import { useQuery } from "@tanstack/react-query";
import { CheckCircle2, XCircle } from "lucide-react";
import { api, errorMessage } from "@/lib/admin/api";
import { API_URL } from "@/lib/config";
import { Card, ErrorBlock, LoadingBlock, PageHeader } from "@/components/admin/ui";

type Info = Record<string, Record<string, unknown> | string>;

const HELP: Record<string, string> = {
  database: "MONGODB_URI",
  cloudinary: "CLOUDINARY_CLOUD_NAME, CLOUDINARY_API_KEY, CLOUDINARY_API_SECRET",
  email: "SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASSWORD, SMTP_FROM, NOTIFY_EMAIL",
  translation: "TRANSLATION_PROVIDER (deepl | google | libretranslate), TRANSLATION_API_KEY, TRANSLATION_API_URL",
  tripadvisor: "TRIPADVISOR_API_KEY, TRIPADVISOR_LOCATION_ID",
  revalidation: "REVALIDATE_SECRET (same value in backend and frontend)",
};

/** Integration status. Secrets are configured in backend environment variables and are never displayed. */
export default function ApiSettingsPage() {
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["integrations"], queryFn: () => api.get<Info>("/admin/system/integrations") });
  if (isLoading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  const info = data.data;
  return (
    <div>
      <PageHeader title="API Settings" description="Status of external services. Keys and secrets live only in the backend .env file and are never sent to the browser." />
      <div className="grid gap-4 md:grid-cols-2">
        {Object.entries(info)
          .filter(([k, v]) => typeof v === "object" && k !== "security")
          .map(([key, value]) => {
            const v = value as Record<string, unknown>;
            const ok = Boolean(v.configured ?? v.connected);
            return (
              <Card key={key} title={<span className="capitalize">{key}</span>} actions={ok ? <CheckCircle2 className="h-5 w-5 text-emerald-600" /> : <XCircle className="h-5 w-5 text-slate-300" />}>
                <dl className="space-y-1 text-sm">
                  {Object.entries(v).map(([k, x]) => (
                    <div key={k} className="flex justify-between gap-3">
                      <dt className="text-slate-500">{k}</dt>
                      <dd className="truncate font-mono text-xs">{String(x ?? "—")}</dd>
                    </div>
                  ))}
                </dl>
                {HELP[key] && <p className="mt-3 text-xs text-slate-400">Env: {HELP[key]}</p>}
              </Card>
            );
          })}
        <Card title="Frontend">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between">
              <dt className="text-slate-500">API URL</dt>
              <dd className="font-mono text-xs">{API_URL}</dd>
            </div>
            <div className="flex justify-between">
              <dt className="text-slate-500">Environment</dt>
              <dd className="font-mono text-xs">{String(info.environment)}</dd>
            </div>
          </dl>
        </Card>
      </div>
    </div>
  );
}
