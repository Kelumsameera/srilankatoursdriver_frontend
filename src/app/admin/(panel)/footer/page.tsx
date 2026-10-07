"use client";

import Link from "next/link";
import { SettingsForm } from "@/components/admin/SettingsForm";
import { Card } from "@/components/admin/ui";

export default function FooterPage() {
  return (
    <SettingsForm
      title="Footer"
      description="Footer description, link columns, automatic tour/destination links, copyright and legal links."
      endpoint="/admin/site-settings"
      permission="settings:update"
      aside={
        <Card title="Also shown in the footer">
          <ul className="list-disc space-y-1 ps-4 text-sm text-slate-600">
            <li>
              Logo – <Link className="text-forest-700 underline" href="/admin/branding">Branding</Link>
            </li>
            <li>
              Address, phone, WhatsApp, email, hours – <Link className="text-forest-700 underline" href="/admin/settings">Site Settings</Link>
            </li>
            <li>
              Social links – <Link className="text-forest-700 underline" href="/admin/social">Social Media</Link>
            </li>
          </ul>
          <p className="mt-3 text-xs text-slate-500">Use {"{year}"} in the copyright to insert the current year.</p>
        </Card>
      }
      sections={[
        {
          title: "Footer content",
          columns: 1,
          fields: [
            {
              name: "footer",
              label: "Footer",
              type: "group",
              fields: [
                { name: "description", label: "Description", type: "textarea", span: 2 },
                { name: "showTourLinks", label: "Show popular tour links", type: "switch" },
                { name: "showDestinationLinks", label: "Show destination links", type: "switch" },
                { name: "showSocial", label: "Show social icons", type: "switch" },
                { name: "copyright", label: "Copyright", type: "text", span: 2 },
                { name: "privacyUrl", label: "Privacy policy URL", type: "text" },
                { name: "termsUrl", label: "Terms URL", type: "text" },
                { name: "cookieUrl", label: "Cookie policy URL", type: "text" },
                {
                  name: "columns",
                  label: "Link columns",
                  type: "objectList",
                  itemTitle: "title",
                  addLabel: "Add column",
                  defaults: { enabled: true, links: [] },
                  fields: [
                    { name: "title", label: "Column title", type: "text", required: true },
                    { name: "enabled", label: "Enabled", type: "switch" },
                    {
                      name: "links",
                      label: "Links",
                      type: "objectList",
                      itemTitle: "label",
                      addLabel: "Add link",
                      fields: [
                        { name: "label", label: "Label", type: "text", required: true },
                        { name: "url", label: "URL", type: "text", required: true },
                      ],
                    },
                  ],
                },
              ],
            },
          ],
        },
      ]}
    />
  );
}
