"use client";

import { SettingsForm } from "@/components/admin/SettingsForm";

const NETWORKS = ["facebook", "instagram", "youtube", "tiktok", "tripadvisor", "twitter", "linkedin", "pinterest"];

export default function SocialPage() {
  return (
    <SettingsForm
      title="Social Media"
      description="Profile links shown in the footer (leave empty to hide a network)."
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
      ]}
    />
  );
}
