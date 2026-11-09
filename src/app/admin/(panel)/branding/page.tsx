"use client";

import Link from "next/link";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/admin/ui";
import { useWatch } from "react-hook-form";
import { Logo } from "@/components/site/Logo";
import type { Branding } from "@/types/cms";

function LogoPreview() {
  const branding = useWatch() as Branding;
  return (
    <Card title="Logo preview">
      <p className="mb-3 text-sm text-slate-600">Changes appear here before saving.</p>
      <div className="space-y-3">
        <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white p-4">
          <Logo branding={branding} siteName="Sri Lanka Tours Driver" mobile />
        </div>
        <div className="overflow-x-auto rounded-xl bg-slate-900 p-4">
          <Logo branding={branding} siteName="Sri Lanka Tours Driver" tone="light" mobile />
        </div>
      </div>
    </Card>
  );
}

export default function BrandingPage() {
  return (
    <SettingsForm
      title="Branding"
      description="Edit your logo icon, text, logo colours and font here. Site-wide colours, fonts and backgrounds are on the Theme page."
      endpoint="/admin/branding"
      permission="branding:update"
      aside={
        <>
        <LogoPreview />
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
        </>
      }
      sections={[
        {
          title: "Icon + text logo",
          description:
            "Set the icon and/or the text to show them instead of the logo images below. Leave both empty to keep using the logo images.",
          fields: [
            { name: "logoIcon", label: "Logo icon", type: "media", accept: "image", folder: "branding", hint: "Square or upright PNG/SVG with a transparent background (e.g. the map pin)." },
            { name: "logoTextLine1", label: "Logo text – line 1", type: "text", placeholder: "SRI LANKA", hint: "Max 30 characters. Empty with an icon set → the site name is shown." },
            { name: "logoTextLine2", label: "Logo text – line 2 (optional)", type: "text", placeholder: "TOURS DRIVER", hint: "Smaller line under line 1. Max 30 characters." },
            { name: "logoFont", label: "Logo font", type: "select", options: ["Poppins", "Playfair Display", "Arial", "Georgia"].map((font) => ({ value: font, label: font })), hint: "Applies to both logo text lines. These fonts are bundled or available on your device." },
            { name: "logoTextColor1", label: "Line 1 colour — light background", type: "color", defaultValue: "#032d55" },
            { name: "logoTextColor2", label: "Line 2 colour — light background", type: "color", defaultValue: "#009f91" },
            { name: "logoLightTextColor1", label: "Line 1 colour — dark background", type: "color", defaultValue: "#ffffff" },
            { name: "logoLightTextColor2", label: "Line 2 colour — dark background", type: "color", defaultValue: "#48d4b0" },
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
