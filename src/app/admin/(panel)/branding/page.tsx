"use client";

import Link from "next/link";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/admin/ui";

export default function BrandingPage() {
  return (
    <SettingsForm
      title="Branding"
      description="Logos and favicon. Files are uploaded to Cloudinary (folder: branding). Colours, fonts and background are on the Theme page."
      endpoint="/admin/branding"
      permission="branding:update"
      aside={
        <Card title="Which logo is used where?">
          <ul className="list-disc space-y-1 ps-4 text-sm text-slate-600">
            <li>
              <strong>Primary</strong> – header after scrolling (light background)
            </li>
            <li>
              <strong>Light</strong> – over the dark hero and in the footer
            </li>
            <li>
              <strong>Mobile</strong> – small screens
            </li>
            <li>
              <strong>Icon + text</strong> – when the icon or line 1 is set, it replaces the logo images everywhere
            </li>
            <li>
              <strong>Favicon</strong> – browser tab (square PNG/SVG)
            </li>
          </ul>
          <p className="mt-3 text-sm text-slate-600">
            Brand colours moved to{" "}
            <Link href="/admin/theme" className="text-forest-700 underline">
              Theme
            </Link>
            , with presets and a live preview.
          </p>
        </Card>
      }
      sections={[
        {
          title: "Icon + text logo",
          description:
            "Set the icon and/or the text to show them instead of the logo images below. Leave both empty to keep using the logo images.",
          fields: [
            { name: "logoIcon", label: "Logo icon", type: "media", accept: "image", folder: "branding", hint: "Square or upright PNG/SVG with a transparent background (e.g. the map pin)." },
            { name: "logoTextLine1", label: "Logo text – line 1", type: "text", placeholder: "SRI LANKA", hint: "Max 30 characters. Empty with an icon set → the site name is shown." },
            { name: "logoTextLine2", label: "Logo text – line 2 (optional)", type: "text", placeholder: "TOURS DRIVER", hint: "Smaller gold line under line 1. Max 30 characters." },
          ],
        },
        {
          title: "Logos",
          fields: [
            { name: "primaryLogo", label: "Primary logo", type: "media", folder: "branding" },
            { name: "lightLogo", label: "Light logo (for dark backgrounds)", type: "media", folder: "branding" },
            { name: "darkLogo", label: "Dark logo", type: "media", folder: "branding" },
            { name: "mobileLogo", label: "Mobile logo", type: "media", folder: "branding" },
            { name: "favicon", label: "Favicon", type: "media", folder: "branding" },
            { name: "logoAlt", label: "Logo alt text", type: "text" },
            { name: "logoWidth", label: "Logo width (px)", type: "number", min: 40, max: 600 },
            { name: "logoHeight", label: "Logo height (px)", type: "number", min: 16, max: 300 },
          ],
        },
      ]}
    />
  );
}
