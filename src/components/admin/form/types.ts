import type { MediaFolder } from "@/lib/admin/upload";

interface Base {
  name: string;
  label: string;
  hint?: string;
  required?: boolean;
  placeholder?: string;
  /** Grid columns to span (1–2) in a two-column section. */
  span?: 1 | 2;
  /**
   * Show the field only when a sibling field has (`in`) / doesn't have (`notIn`) one of the values.
   * Hidden fields keep their value but are never required.
   */
  showWhen?: { field: string; in?: string[]; notIn?: string[] };
}

export type FieldDef =
  | (Base & { type: "text" | "textarea" | "markdown" | "url" | "email" | "color" | "slug" })
  | (Base & { type: "number"; min?: number; max?: number; step?: number; /** empty → null (clears the value) instead of being omitted */ nullable?: boolean })
  | (Base & { type: "date" | "datetime" })
  | (Base & { type: "switch" })
  | (Base & { type: "select"; options: { value: string; label: string }[]; allowEmpty?: boolean })
  | (Base & { type: "tags" | "list" })
  | (Base & { type: "icon" })
  | (Base & { type: "media"; accept?: "image" | "video" | "any"; folder?: MediaFolder })
  | (Base & { type: "mediaList"; accept?: "image" | "video" | "any"; folder?: MediaFolder })
  | (Base & { type: "relation"; endpoint: string; labelKey: string; multiple?: boolean; query?: Record<string, string> })
  | (Base & { type: "group"; fields: FieldDef[] })
  | (Base & { type: "objectList"; fields: FieldDef[]; itemTitle?: string; addLabel?: string; defaults?: Record<string, unknown> });

export interface FormSection {
  title: string;
  description?: string;
  fields: FieldDef[];
  columns?: 1 | 2;
}
