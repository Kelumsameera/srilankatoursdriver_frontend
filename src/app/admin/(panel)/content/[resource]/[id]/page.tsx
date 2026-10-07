"use client";

import { use } from "react";
import { notFound } from "next/navigation";
import { RESOURCES } from "@/features/admin/resources";
import { ResourceEditor } from "@/components/admin/ResourceEditor";

export default function ResourceEditPage({ params }: { params: Promise<{ resource: string; id: string }> }) {
  const { resource, id } = use(params);
  const config = RESOURCES[resource];
  if (!config || !(id === "new" || /^[a-f0-9]{24}$/i.test(id))) notFound();
  return <ResourceEditor key={`${config.key}-${id}`} resource={config} id={id} />;
}
