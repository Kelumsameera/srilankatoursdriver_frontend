"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { RESOURCES } from "@/features/admin/resources";
import { ResourceList } from "@/components/admin/ResourceList";

export default function ResourceListPage({ params }: { params: Promise<{ resource: string }> }) {
  const { resource } = use(params);
  const config = RESOURCES[resource];
  if (!config) notFound();
  return <ResourceList key={config.key} resource={config} />;
}
