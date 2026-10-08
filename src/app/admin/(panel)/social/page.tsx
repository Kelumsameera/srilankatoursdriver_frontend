"use client";

import { SettingsForm } from "@/components/admin/SettingsForm";

const NETWORKS = ["facebook", "instagram", "youtube", "tiktok", "tripadvisor", "twitter", "linkedin", "pinterest"];

export default function SocialPage() {
  return (
    <SettingsForm
      title="Social Media & Partners"
      description="Profile links shown in the footer and trust bar (leave empty to hide a network), plus accreditation / partner logos."
      endpoint="/admin/site-settings"
      permission="settings:update"
      sections={[
        {
          title: "Profiles",
          columns: 1,
          fields: [
            {
              name: "social",
              label: "Social profiles",
              type: "group",
              fields: NETWORKS.map((n) => ({ name: n, label: n.charAt(0).toUpperCase() + n.slice(1), type: "url" as const, placeholder: "https://…" })),
            },
          ],
        },
        {
          title: "Partners & accreditations",
          description: "Logos shown in the trust bar above the footer (e.g. Sri Lanka Tourism, SLTDA, PATA, TripAdvisor). Leave empty to hide that row.",
          columns: 1,
          fields: [
            {
              name: "partners",
              label: "Partners",
              type: "objectList",
              itemTitle: "name",
              addLabel: "Add partner",
              fields: [
                { name: "name", label: "Name", type: "text", required: true },
                { name: "url", label: "Website", type: "url", placeholder: "https://…" },
                { name: "logo", label: "Logo", type: "media", folder: "branding", span: 2 },
              ],
            },
          ],
        },
      ]}
    />
  );
}
