"use client";

import { useEffect, useState, type ReactNode } from "react";
import { useController, useFieldArray, useFormContext, type FieldValues } from "react-hook-form";
import { useQuery } from "@tanstack/react-query";
import { ArrowDown, ArrowUp, ChevronDown, ChevronRight, Copy, Plus, Trash2 } from "lucide-react";
import { api, qs } from "@/lib/admin/api";
import { FEATURE_ICONS } from "@/components/ui/icons";
import { Button, FieldError, Input, Label, Select, Switch, Textarea } from "../ui";
import { MediaField, MediaListField } from "../MediaLibrary";
import type { FieldDef } from "./types";
import type { MediaAsset } from "@/types/cms";

function getError(errors: unknown, path: string): string | undefined {
  const e = path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], errors) as { message?: string } | undefined;
  return e?.message;
}

/** Markdown editor with live preview toggle. */
function MarkdownInput({ value, onChange, id }: { value: string; onChange: (v: string) => void; id: string }) {
  const [preview, setPreview] = useState(false);
  const [Md, setMd] = useState<null | typeof import("@/components/ui/Markdown").Markdown>(null);
  useEffect(() => {
    if (preview && !Md) void import("@/components/ui/Markdown").then((m) => setMd(() => m.Markdown));
  }, [preview, Md]);
  return (
    <div className="overflow-hidden rounded-lg border border-slate-300">
      <div className="flex items-center justify-between border-b border-slate-200 bg-slate-50 px-2 py-1 text-xs">
        <span className="text-slate-500">Markdown: **bold**, _italic_, ## Heading, - list, [link](https://…)</span>
        <button type="button" className="rounded px-2 py-0.5 font-medium text-forest-700 hover:bg-white" onClick={() => setPreview((p) => !p)}>
          {preview ? "Edit" : "Preview"}
        </button>
      </div>
      {preview ? (
        <div className="max-h-96 min-h-32 overflow-auto bg-white p-4">{Md ? <Md content={value} /> : null}</div>
      ) : (
        <textarea id={id} className="block min-h-48 w-full resize-y p-3 font-mono text-sm focus:outline-none" value={value ?? ""} onChange={(e) => onChange(e.target.value)} />
      )}
    </div>
  );
}

function TagsInput({ value, onChange, id, placeholder }: { value: string[]; onChange: (v: string[]) => void; id: string; placeholder?: string }) {
  const [draft, setDraft] = useState("");
  const add = () => {
    const parts = draft.split(",").map((s) => s.trim()).filter(Boolean);
    if (parts.length) onChange([...(value ?? []), ...parts.filter((p) => !(value ?? []).includes(p))]);
    setDraft("");
  };
  return (
    <div className="flex min-h-10 flex-wrap items-center gap-1.5 rounded-lg border border-slate-300 bg-white px-2 py-1.5">
      {(value ?? []).map((tag) => (
        <span key={tag} className="inline-flex items-center gap-1 rounded-md bg-slate-100 px-2 py-0.5 text-xs">
          {tag}
          <button type="button" onClick={() => onChange(value.filter((t) => t !== tag))} aria-label={`Remove ${tag}`} className="text-slate-400 hover:text-red-600">
            ×
          </button>
        </span>
      ))}
      <input
        id={id}
        className="min-w-24 flex-1 bg-transparent text-sm focus:outline-none"
        placeholder={placeholder ?? "Type and press Enter"}
        value={draft}
        onChange={(e) => setDraft(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter" || e.key === ",") {
            e.preventDefault();
            add();
          } else if (e.key === "Backspace" && !draft && value?.length) onChange(value.slice(0, -1));
        }}
        onBlur={add}
      />
    </div>
  );
}

/** One item per line. */
function ListInput({ value, onChange, id, placeholder }: { value: string[]; onChange: (v: string[]) => void; id: string; placeholder?: string }) {
  return (
    <Textarea
      id={id}
      placeholder={placeholder ?? "One item per line"}
      value={(value ?? []).join("\n")}
      onChange={(e) => onChange(e.target.value.split("\n"))}
      className="min-h-28"
    />
  );
}

function RelationInput({ field, value, onChange, id }: { field: Extract<FieldDef, { type: "relation" }>; value: string | string[]; onChange: (v: string | string[]) => void; id: string }) {
  const { data, isLoading } = useQuery({
    queryKey: ["relation", field.endpoint, field.query],
    queryFn: () => api.get<Record<string, unknown>[]>(`${field.endpoint}${qs({ limit: 100, ...field.query })}`),
    staleTime: 60_000,
  });
  const options = (data?.data ?? []).map((o) => ({ value: String(o._id), label: String(o[field.labelKey] ?? o._id) }));
  if (field.multiple) {
    const selected = Array.isArray(value) ? value : [];
    return (
      <div className="max-h-56 overflow-auto rounded-lg border border-slate-300 bg-white p-2">
        {isLoading && <p className="p-2 text-xs text-slate-400">Loading…</p>}
        {!isLoading && options.length === 0 && <p className="p-2 text-xs text-slate-400">Nothing to choose from yet.</p>}
        <div className="grid gap-1 sm:grid-cols-2">
          {options.map((o) => (
            <label key={o.value} className="flex cursor-pointer items-center gap-2 rounded px-2 py-1 text-sm hover:bg-slate-50">
              <input
                type="checkbox"
                className="accent-forest-700"
                checked={selected.includes(o.value)}
                onChange={(e) => onChange(e.target.checked ? [...selected, o.value] : selected.filter((v) => v !== o.value))}
              />
              {o.label}
            </label>
          ))}
        </div>
      </div>
    );
  }
  return (
    <Select id={id} value={(value as string) ?? ""} onChange={(e) => onChange(e.target.value)}>
      <option value="">— None —</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </Select>
  );
}

function ObjectList({ field, path }: { field: Extract<FieldDef, { type: "objectList" }>; path: string }) {
  const { control, watch } = useFormContext();
  const { fields, append, remove, move, insert } = useFieldArray({ control, name: path });
  const [open, setOpen] = useState<Record<string, boolean>>({});
  const items = watch(path) as Record<string, unknown>[] | undefined;
  return (
    <div className="space-y-2">
      {fields.map((item, i) => {
        const title = String(items?.[i]?.[field.itemTitle ?? "title"] ?? "") || `Item ${i + 1}`;
        const isOpen = open[item.id] ?? false;
        return (
          <div key={item.id} className="rounded-lg border border-slate-200 bg-slate-50/60">
            <div className="flex items-center gap-2 px-3 py-2">
              <button type="button" className="flex flex-1 items-center gap-2 text-start text-sm font-medium text-slate-700" onClick={() => setOpen((o) => ({ ...o, [item.id]: !isOpen }))}>
                {isOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                <span className="truncate">{title}</span>
              </button>
              <Button variant="ghost" size="sm" onClick={() => i > 0 && move(i, i - 1)} aria-label="Move up" disabled={i === 0}>
                <ArrowUp className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => i < fields.length - 1 && move(i, i + 1)} aria-label="Move down" disabled={i === fields.length - 1}>
                <ArrowDown className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                aria-label="Duplicate"
                onClick={() => {
                  const copy = { ...(items?.[i] ?? {}) };
                  delete copy._id;
                  insert(i + 1, copy);
                }}
              >
                <Copy className="h-3.5 w-3.5" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => remove(i)} aria-label="Remove">
                <Trash2 className="h-3.5 w-3.5 text-red-600" />
              </Button>
            </div>
            {isOpen && (
              <div className="grid gap-4 border-t border-slate-200 bg-white p-4 sm:grid-cols-2">
                {field.fields.map((sub) => (
                  <FormField key={sub.name} field={sub} path={`${path}.${i}.${sub.name}`} />
                ))}
              </div>
            )}
          </div>
        );
      })}
      <Button
        variant="outline"
        size="sm"
        onClick={() => {
          const defaults = typeof field.defaults === "object" ? { ...field.defaults } : {};
          if (field.name === "itinerary") defaults.day = fields.length + 1;
          append(defaults);
          setOpen((o) => ({ ...o }));
        }}
      >
        <Plus className="h-4 w-4" /> {field.addLabel ?? "Add item"}
      </Button>
    </div>
  );
}

const CONTROLLED = new Set(["markdown", "color", "switch", "tags", "list", "media", "mediaList", "relation"]);

function requiredRule(field: FieldDef) {
  return field.required
    ? { validate: (v: unknown) => (v !== "" && v !== null && v !== undefined && !(Array.isArray(v) && v.length === 0)) || `${field.label} is required` }
    : undefined;
}

function Wrapper({ field, id, error, children }: { field: FieldDef; id: string; error?: string; children: ReactNode }) {
  const span = field.span === 2 || ["markdown", "group", "objectList", "mediaList", "list"].includes(field.type) ? "sm:col-span-2" : "";
  return (
    <div className={span}>
      <Label htmlFor={id} required={field.required} hint={field.type !== "switch" ? field.hint : undefined}>
        {field.label}
      </Label>
      {children}
      <FieldError message={error} />
    </div>
  );
}

/** Complex inputs bound through useController. */
function ControlledField({ field, path, id, error }: { field: FieldDef; path: string; id: string; error?: string }) {
  const { control } = useFormContext<FieldValues>();
  const { field: ctrl } = useController({ control, name: path, rules: requiredRule(field) });
  let input: ReactNode = null;
  switch (field.type) {
    case "markdown":
      input = <MarkdownInput id={id} value={ctrl.value as string} onChange={ctrl.onChange} />;
      break;
    case "color":
      input = (
        <div className="flex gap-2">
          <input type="color" className="h-10 w-12 cursor-pointer rounded border border-slate-300" value={(ctrl.value as string) || "#000000"} onChange={(e) => ctrl.onChange(e.target.value)} aria-label={field.label} />
          <Input id={id} value={(ctrl.value as string) ?? ""} onChange={(e) => ctrl.onChange(e.target.value)} />
        </div>
      );
      break;
    case "switch":
      input = <Switch id={id} checked={Boolean(ctrl.value)} onChange={ctrl.onChange} label={field.hint} />;
      break;
    case "tags":
      input = <TagsInput id={id} value={ctrl.value as string[]} onChange={ctrl.onChange} placeholder={field.placeholder} />;
      break;
    case "list":
      input = <ListInput id={id} value={ctrl.value as string[]} onChange={ctrl.onChange} placeholder={field.placeholder} />;
      break;
    case "media":
      input = <MediaField value={ctrl.value as MediaAsset | null} onChange={ctrl.onChange} accept={field.accept} folder={field.folder} label={field.label} />;
      break;
    case "mediaList":
      input = <MediaListField value={ctrl.value as MediaAsset[]} onChange={ctrl.onChange} folder={field.folder} accept={field.accept} />;
      break;
    case "relation":
      input = <RelationInput id={id} field={field} value={ctrl.value as string | string[]} onChange={ctrl.onChange} />;
      break;
  }
  return (
    <Wrapper field={field} id={id} error={error}>
      {input}
    </Wrapper>
  );
}

/** Native inputs bound through register (uncontrolled = fast). */
function RegisteredField({ field, path, id, error }: { field: FieldDef; path: string; id: string; error?: string }) {
  const { register } = useFormContext<FieldValues>();
  const reg = register(path, requiredRule(field));
  let input: ReactNode;
  switch (field.type) {
    case "textarea":
      input = <Textarea id={id} placeholder={field.placeholder} aria-invalid={!!error} {...reg} />;
      break;
    case "number":
      input = <Input id={id} type="number" min={field.min} max={field.max} step={field.step ?? "any"} aria-invalid={!!error} {...reg} />;
      break;
    case "date":
      input = <Input id={id} type="date" aria-invalid={!!error} {...reg} />;
      break;
    case "datetime":
      input = <Input id={id} type="datetime-local" aria-invalid={!!error} {...reg} />;
      break;
    case "select":
      input = (
        <Select id={id} aria-invalid={!!error} {...reg}>
          {field.allowEmpty && <option value="">— None —</option>}
          {field.options.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </Select>
      );
      break;
    case "icon":
      input = (
        <Select id={id} {...reg}>
          <option value="">— Icon —</option>
          {Object.keys(FEATURE_ICONS).map((k) => (
            <option key={k} value={k}>
              {k}
            </option>
          ))}
        </Select>
      );
      break;
    default:
      input = (
        <Input
          id={id}
          type={field.type === "email" ? "email" : "text"}
          placeholder={field.placeholder ?? (field.type === "slug" ? "auto-generated from the title" : undefined)}
          aria-invalid={!!error}
          {...reg}
        />
      );
  }
  return (
    <Wrapper field={field} id={id} error={error}>
      {input}
    </Wrapper>
  );
}

/** Renders one configured field bound to react-hook-form at `path`. */
export function FormField({ field, path }: { field: FieldDef; path: string }) {
  const { formState } = useFormContext<FieldValues>();
  const id = `f-${path.replace(/\./g, "-")}`;
  const error = getError(formState.errors, path);

  if (field.type === "group") {
    return (
      <fieldset className="rounded-lg border border-slate-200 p-4 sm:col-span-2">
        <legend className="px-1 text-xs font-semibold uppercase tracking-wide text-slate-600">{field.label}</legend>
        {field.hint && <p className="mb-3 text-xs text-slate-500">{field.hint}</p>}
        <div className="grid gap-4 sm:grid-cols-2">
          {field.fields.map((sub) => (
            <FormField key={sub.name} field={sub} path={`${path}.${sub.name}`} />
          ))}
        </div>
      </fieldset>
    );
  }
  if (field.type === "objectList") {
    return (
      <Wrapper field={field} id={id} error={error}>
        <ObjectList field={field} path={path} />
      </Wrapper>
    );
  }
  return CONTROLLED.has(field.type) ? <ControlledField field={field} path={path} id={id} error={error} /> : <RegisteredField field={field} path={path} id={id} error={error} />;
}
