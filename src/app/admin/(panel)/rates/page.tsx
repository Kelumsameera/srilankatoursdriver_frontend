"use client";

import { SettingsForm } from "@/components/admin/SettingsForm";
import type { FieldDef } from "@/components/admin/form/types";

const rateRowFields: FieldDef[] = [
  { name: "destination", label: "Destination", type: "text", required: true, span: 2 },
  { name: "car", label: "Car", type: "number", min: 0, nullable: true },
  { name: "van", label: "Van", type: "number", min: 0, nullable: true },
  { name: "bus", label: "Bus", type: "number", min: 0, nullable: true },
  { name: "distanceKm", label: "Distance (km)", type: "number", min: 0, nullable: true },
  { name: "duration", label: "Est. duration", type: "text", placeholder: "4 hours (toll road)", span: 2 },
];

/** Transfer price tables, one per starting point; each excursion page shows the table that starts at its place. */
export default function TransferRatesPage() {
  return (
    <SettingsForm
      title="Transfer Rates"
      description="Fixed transfer prices per destination. Each excursion page shows the table for its starting point. Leave the list empty (or switch it off) to hide the tables."
      endpoint="/admin/site-settings"
      permission="settings:update"
      sections={[
        {
          title: "Excursion pages – transfers per starting point",
          fields: [
            {
              name: "excursionRates",
              label: "Settings",
              type: "group",
              fields: [
                { name: "enabled", label: "Show on the website", type: "switch" },
                { name: "currency", label: "Currency", type: "text", defaultValue: "LKR", required: true, placeholder: "LKR", hint: "3-letter code, e.g. LKR" },
                { name: "title", label: "Title", type: "text", placeholder: "Transfer Rates", hint: "empty = translated default" },
                { name: "subtitle", label: "Subtitle", type: "text", placeholder: "Fixed prices for pick-up and drop-off", hint: "empty = translated default" },
                { name: "note", label: "Note under the table", type: "textarea", span: 2, placeholder: "Prices are for pick-up and drop-off only." },
                {
                  name: "tables",
                  label: "Starting points",
                  type: "objectList",
                  itemTitle: "origin",
                  addLabel: "Add starting point",
                  fields: [
                    { name: "origin", label: "Starting point", type: "text", required: true, span: 2, placeholder: "Airport (CMB)" },
                    { name: "rows", label: "Destinations", type: "objectList", itemTitle: "destination", addLabel: "Add destination", fields: rateRowFields },
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
