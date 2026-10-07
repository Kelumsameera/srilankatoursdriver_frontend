"use client";

import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/admin/ui";

export default function BrandingPage() {
  return (
    <SettingsForm
      title="Branding"
      description="Logos, favicon and brand colours. Files are uploaded to Cloudinary (folder: branding)."
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
              <strong>Favicon</strong> – browser tab (square PNG/SVG)
            </li>
          </ul>
        </Card>
      }
      sections={[
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
        {
          title: "Colours",
          fields: [
            {
              name: "colors",
              label: "Brand colours",
              type: "group",
              fields: [
                { name: "primary", label: "Primary (deep forest green)", type: "color" },
                { name: "secondary", label: "Secondary (tropical green)", type: "color" },
                { name: "accent", label: "Accent (warm gold)", type: "color" },
              ],
            },
          ],
        },
      ]}
    />
  );
}
