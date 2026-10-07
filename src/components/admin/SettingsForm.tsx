"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { api, errorMessage } from "@/lib/admin/api";
import { useAuth } from "@/lib/admin/auth";
import { EntityForm } from "./form/EntityForm";
import type { FormSection } from "./form/types";
import { ErrorBlock, LoadingBlock, PageHeader } from "./ui";
import type { ReactNode } from "react";

/** Loads a singleton settings document and saves only the fields shown in this form. */
export function SettingsForm({
  title,
  description,
  endpoint,
  sections,
  permission,
  aside,
}: {
  title: string;
  description?: string;
  endpoint: "/admin/site-settings" | "/admin/branding";
  sections: FormSection[];
  permission: string;
  aside?: ReactNode;
}) {
  const qc = useQueryClient();
  const { can } = useAuth();
  const { data, isLoading, error, refetch } = useQuery({ queryKey: ["settings", endpoint], queryFn: () => api.get<Record<string, unknown>>(endpoint) });
  if (isLoading) return <LoadingBlock />;
  if (error || !data) return <ErrorBlock message={errorMessage(error)} onRetry={() => refetch()} />;
  return (
    <div>
      <PageHeader title={title} description={description} />
      <EntityForm
        sections={sections}
        initial={data.data}
        readOnly={!can(permission)}
        aside={aside}
        onSubmit={async (payload) => {
          await api.put(endpoint, payload);
          await qc.invalidateQueries({ queryKey: ["settings", endpoint] });
          toast.success("Saved – the public website has been refreshed");
        }}
      />
    </div>
  );
}
