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

/** Converts form values back into an API payload. */
export function fromFormValues(fields: FieldDef[], values: Rec = {}): Rec {
  const out: Rec = {};
  for (const f of fields) {
    const v = values[f.name];
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
