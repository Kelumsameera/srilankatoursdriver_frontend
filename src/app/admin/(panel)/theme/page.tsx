import type { Metadata } from "next";
import { ThemeEditor } from "@/components/admin/theme/ThemeEditor";

export const metadata: Metadata = { title: "Site Appearance" };

export default function ThemePage() {
  return <ThemeEditor />;
}
