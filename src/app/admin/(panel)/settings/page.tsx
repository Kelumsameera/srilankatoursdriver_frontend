"use client";

import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/admin/ui";

const LANGS = ["en", "si", "ta", "de", "fr", "es", "it", "zh", "ja", "ko", "ru", "ar", "hi", "pt"].map((v) => ({ value: v, label: v.toUpperCase() }));

export default function SiteSettingsPage() {
  return (
    <SettingsForm
      title="Site Settings"
      description="Business details used everywhere on the website (header, footer, contact page, WhatsApp buttons, metadata)."
      endpoint="/admin/site-settings"
      permission="settings:update"
      aside={
        <Card title="Tip">
          <p className="text-sm text-slate-600">
            Changing the WhatsApp number updates every WhatsApp button on the site instantly. Translate the business hours and tagline in Translations → Content Translation (Site settings).
          </p>
        </Card>
      }
      sections={[
        {
          title: "Business",
          fields: [
            { name: "siteName", label: "Site name", type: "text", required: true },
            { name: "businessName", label: "Business name", type: "text", required: true },
            { name: "tagline", label: "Tagline", type: "text", span: 2 },
            { name: "websiteUrl", label: "Website URL", type: "url" },
            { name: "email", label: "Email", type: "email" },
            { name: "phone", label: "Phone", type: "text" },
            { name: "whatsapp", label: "WhatsApp number", type: "text", hint: "international format, e.g. +94769300334" },
            { name: "whatsappMessage", label: "Default WhatsApp message", type: "text", span: 2 },
            { name: "businessHours", label: "Business hours", type: "text", span: 2 },
          ],
        },
        {
          title: "Location",
          fields: [
            { name: "address", label: "Address", type: "textarea", span: 2 },
            { name: "googleMapsUrl", label: "Google Maps link", type: "url" },
            { name: "mapEmbedUrl", label: "Google Maps embed URL (optional)", type: "url", hint: "Maps → Share → Embed → src" },
          ],
        },
        {
          title: "Regional",
          fields: [
            { name: "timezone", label: "Timezone", type: "text" },
            { name: "currency", label: "Default currency", type: "text" },
            { name: "defaultLanguage", label: "Default language", type: "select", options: LANGS },
            { name: "maintenanceMode", label: "Maintenance mode", type: "switch", hint: "reserved for future use" },
          ],
        },
        {
          title: "TripAdvisor",
          fields: [
            { name: "tripadvisor", label: "TripAdvisor", type: "group", fields: [
              { name: "enabled", label: "Show TripAdvisor section", type: "switch" },
              { name: "profileUrl", label: "Profile URL", type: "url" },
              { name: "ratingText", label: "Rating text (shown when the API is not configured)", type: "text", span: 2 },
            ] },
          ],
        },
      ]}
    />
  );
}
