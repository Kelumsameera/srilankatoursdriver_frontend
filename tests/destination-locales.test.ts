import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { locales } from "@/i18n/routing";

describe("destination interface translations", () => {
  it.each(locales)("provides all editorial labels and interpolation tokens in %s", (locale) => {
    const { destination } = JSON.parse(fs.readFileSync(path.resolve("messages", `${locale}.json`), "utf8"));
    for (const key of ["featuredExperiences", "exploreTours", "mapLabel", "locationUnavailable", "mapCaption", "descriptionFallback", "breadcrumb", "destinationsLabel"]) {
      expect(destination[key]?.trim()).toBeTruthy();
    }
    expect(destination.mapLabel).toContain("{name}");
    expect(destination.descriptionFallback).toContain("{name}");
  });
});
