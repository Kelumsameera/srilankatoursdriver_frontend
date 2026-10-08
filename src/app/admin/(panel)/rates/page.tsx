"use client";

import { SettingsForm } from "@/components/admin/SettingsForm";

/** "Tour Package Rates – Fixed rates from Airport (CMB)" table shown on the destination pages. */
export default function TransferRatesPage() {
  return (
    <SettingsForm
      title="Transfer Rates"
      description="Fixed airport-transfer prices per destination, shown as a table on the Destinations pages. Leave the list empty (or switch it off) to hide the table."
      endpoint="/admin/site-settings"
      permission="settings:update"
      sections={[
        {
          title: "Table",
          fields: [
            {
              name: "transferRates",
              label: "Settings",
              type: "group",
              fields: [
                { name: "enabled", label: "Show on the website", type: "switch" },
                { name: "currency", label: "Currency", type: "text", placeholder: "USD", hint: "3-letter code" },
                { name: "title", label: "Title", type: "text", placeholder: "Tour Package Rates", hint: "empty = translated default" },
                { name: "subtitle", label: "Subtitle", type: "text", placeholder: "Fixed Rates from Airport (CMB)", hint: "empty = translated default" },
                { name: "note", label: "Note under the table", type: "textarea", span: 2, placeholder: "Prices include highway tolls where specified." },
                {
                  name: "rows",
                  label: "Destinations",
                  type: "objectList",
                  itemTitle: "destination",
                  addLabel: "Add destination",
                  fields: [
                    { name: "destination", label: "Destination", type: "text", required: true, span: 2 },
                    { name: "car", label: "Car", type: "number", min: 0, nullable: true },
                    { name: "van", label: "Van", type: "number", min: 0, nullable: true },
                    { name: "bus", label: "Bus", type: "number", min: 0, nullable: true },
                    { name: "distanceKm", label: "Distance (km)", type: "number", min: 0, nullable: true },
                    { name: "duration", label: "Est. duration", type: "text", placeholder: "4 hours (toll road)", span: 2 },
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
