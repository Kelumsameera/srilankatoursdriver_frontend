import type { FieldValues, RegisterOptions } from "react-hook-form";
import type { FieldDef, FormSection } from "./types";

type Rec = Record<string, unknown>;

const toDateInput = (v: unknown) => (v ? new Date(String(v)).toISOString().slice(0, 10) : "");
const toDateTimeInput = (v: unknown) => {
  if (!v) return "";
  const d = new Date(String(v));
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
};

function refId(v: unknown): string {
  if (!v) return "";
  if (typeof v === "object" && v !== null && "_id" in v) return String((v as Rec)._id);
  return String(v);
}

/** Converts API data into form-friendly values (dates → input strings, populated refs → ids). */
export function toFormValues(fields: FieldDef[], data: Rec = {}): Rec {
  const out: Rec = {};
  for (const f of fields) {
    const v = data[f.name];
    switch (f.type) {
      case "date":
        out[f.name] = toDateInput(v);
        break;
      case "datetime":
        out[f.name] = toDateTimeInput(v);
        break;
      case "switch":
        out[f.name] = Boolean(v);
        break;
      case "tags":
      case "list":
        out[f.name] = Array.isArray(v) ? v : [];
        break;
      case "mediaList":
        out[f.name] = Array.isArray(v) ? v : [];
        break;
      case "media":
        out[f.name] = v ?? null;
        break;
      case "relation":
        out[f.name] = f.multiple ? (Array.isArray(v) ? v.map(refId) : []) : refId(v);
        break;
      case "group":
        out[f.name] = toFormValues(f.fields, (v as Rec) ?? {});
        break;
      case "objectList":
        out[f.name] = Array.isArray(v) ? v.map((item) => ({ ...toFormValues(f.fields, item as Rec), ...((item as Rec)?._id ? { _id: (item as Rec)._id } : {}) })) : [];
        break;
      case "number":
        out[f.name] = v === null || v === undefined ? "" : v;
        break;
      default:
        out[f.name] = v ?? "";
    }
  }
  return out;
}

/** Whether a `showWhen` field is visible for the given value of its controlling sibling. */
export function isShown(field: FieldDef, siblingValue: unknown): boolean {
  const cond = field.showWhen;
  if (!cond) return true;
  const v = String(siblingValue ?? "");
  if (cond.in && !cond.in.includes(v)) return false;
  if (cond.notIn && cond.notIn.includes(v)) return false;
  return true;
}

/** Converts form values back into an API payload. */
export function fromFormValues(fields: FieldDef[], values: Rec = {}): Rec {
  const out: Rec = {};
  for (const f of fields) {
    const v = values[f.name];
    // A hidden conditional field is cleared so stale data (e.g. an old URL after switching to an upload) isn't saved.
    if (f.showWhen && !isShown(f, values[f.showWhen.field])) {
      out[f.name] = f.type === "media" || f.type === "relation" ? null : f.type === "mediaList" || f.type === "tags" || f.type === "list" ? [] : "";
      continue;
    }
    switch (f.type) {
      case "number": {
        const n = v === "" || v === null || v === undefined ? null : Number(v);
        out[f.name] = n === null || Number.isNaN(n) ? (f.nullable ? null : undefined) : n;
        break;
      }
      case "date":
      case "datetime":
        out[f.name] = v ? new Date(String(v)).toISOString() : null;
        break;
      case "tags":
      case "list":
        out[f.name] = (Array.isArray(v) ? v : []).map((s) => String(s).trim()).filter(Boolean);
        break;
      case "relation":
        out[f.name] = f.multiple ? (Array.isArray(v) ? v.filter(Boolean) : []) : v || null;
        break;
      case "group":
        out[f.name] = fromFormValues(f.fields, (v as Rec) ?? {});
        break;
      case "objectList":
        out[f.name] = (Array.isArray(v) ? v : []).map((item) => ({
          ...fromFormValues(f.fields, item as Rec),
          ...((item as Rec)?._id ? { _id: (item as Rec)._id } : {}),
        }));
        break;
      case "slug":
        out[f.name] = typeof v === "string" ? v.trim().toLowerCase() : "";
        break;
      default:
        out[f.name] = v;
    }
  }
  return out;
}

export const allFields = (sections: FormSection[]) => sections.flatMap((s) => s.fields);

/** Path of a sibling field (same group / list item) – used by `showWhen`. */
export const siblingPath = (path: string, name: string) => path.split(".").slice(0, -1).concat(name).join(".");

export function getPath(obj: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown> | undefined)?.[k], obj);
}

const isEmpty = (v: unknown) =>
  v === "" || v === null || v === undefined || (typeof v === "string" && !v.trim()) || (Array.isArray(v) && v.length === 0) || (typeof v === "object" && v !== null && "url" in v && !(v as { url?: unknown }).url);

const HTTP_URL = /^https?:\/\/[^\s]+$/i;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

/**
 * Client-side rules mirroring the API's Zod schemas (the API still validates everything):
 * required (skipped while the field is hidden by `showWhen`), http(s) URLs, emails, slugs and number ranges.
 */
export function fieldRules(field: FieldDef, path: string): RegisterOptions<FieldValues> {
  return {
    validate: (v: unknown, all: FieldValues) => {
      if (field.showWhen && !isShown(field, getPath(all, siblingPath(path, field.showWhen.field)))) return true;
      if (isEmpty(v)) return field.required ? `${field.label} is required` : true;
      const s = String(v).trim();
      switch (field.type) {
        case "url":
          return HTTP_URL.test(s) || "Enter a full URL starting with https://";
        case "email":
          return EMAIL.test(s) || "Enter a valid email address";
        case "slug":
          return SLUG.test(s.toLowerCase()) || "Use lowercase letters, numbers and hyphens only";
        case "number": {
          const n = Number(v);
          if (Number.isNaN(n)) return "Enter a number";
          if (field.min !== undefined && n < field.min) return `Must be at least ${field.min}`;
          if (field.max !== undefined && n > field.max) return `Must be at most ${field.max}`;
          return true;
        }
        default:
          return true;
      }
    },
  };
}
