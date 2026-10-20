"use client";

import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useQuery } from "@tanstack/react-query";
import { Empty, Label, LoadingBlock, PageHeader, Select } from "@/components/admin/ui";
import { TranslationPanel, entityTranslationsQuery, translationOverviewQuery } from "@/components/admin/TranslationPanel";

function Editor() {
  const params = useSearchParams();
  const router = useRouter();
  const type = params.get("type") ?? "tour";
  const id = params.get("id") ?? "";
  const [locale, setLocale] = useState(params.get("locale") ?? "de");

  const overview = useQuery(translationOverviewQuery(type));
  const entity = useQuery({ ...entityTranslationsQuery(type, id), enabled: !!id });

  const setParam = (k: string, v: string) => {
    const next = new URLSearchParams(params.toString());
    next.set(k, v);
    if (k === "type") next.delete("id");
    router.replace(`?${next.toString()}`);
  };

  const o = overview.data?.data;

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

      {!id ? <Empty>Choose an item to translate.</Empty> : <TranslationPanel type={type} id={id} locale={locale} />}
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
