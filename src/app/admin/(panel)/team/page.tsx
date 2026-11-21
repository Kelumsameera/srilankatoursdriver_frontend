"use client";

import { SettingsForm } from "@/components/admin/SettingsForm";

export default function TeamPage() {
  return (
    <SettingsForm
      title="Our Team"
      description="Drivers, guides and staff shown in the website's team section, plus group / team photos. Drag order = display order."
      endpoint="/admin/site-settings"
      permission="settings:update"
      sections={[
        {
          title: "Section",
          columns: 2,
          fields: [
            {
              name: "team",
              label: "Team section",
              type: "group",
              span: 2,
              fields: [
                { name: "enabled", label: "Show team section", type: "switch", defaultValue: true, span: 2 },
                { name: "title", label: "Title", type: "text", placeholder: "Meet our team" },
                { name: "subtitle", label: "Subtitle", type: "textarea" },
                {
                  name: "members",
                  label: "Team members",
                  type: "objectList",
                  itemTitle: "name",
                  addLabel: "Add team member",
                  defaults: { enabled: true },
                  span: 2,
                  fields: [
                    { name: "name", label: "Name", type: "text", required: true },
                    { name: "role", label: "Role", type: "text", placeholder: "Chauffeur guide" },
                    { name: "languages", label: "Languages spoken", type: "tags", hint: "e.g. English, German" },
                    { name: "enabled", label: "Visible on website", type: "switch", defaultValue: true },
                    { name: "bio", label: "Short bio", type: "textarea", span: 2 },
                    { name: "photo", label: "Photo", type: "media", accept: "image", folder: "pages", span: 2 },
                  ],
                },
                { name: "images", label: "Team photos", type: "mediaList", accept: "image", folder: "pages", span: 2, hint: "Group photos of the team, vehicles with drivers, etc." },
              ],
            },
          ],
        },
      ]}
    />
  );
}
