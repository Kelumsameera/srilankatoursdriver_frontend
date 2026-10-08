import { afterEach, describe, expect, it, vi } from "vitest";
import { AdminApiError, errorMessage } from "@/lib/admin/api";
import { submitPublic } from "@/lib/api/public-client";
import { routePermission } from "@/features/admin/navigation";
import { RESOURCES } from "@/features/admin/resources";
import { fieldRules, fromFormValues } from "@/components/admin/form/values";
import type { FieldDef } from "@/components/admin/form/types";

describe("API error messages", () => {
  it("keeps curated 4xx messages and field details", () => {
    expect(errorMessage(new AdminApiError(400, "Validation failed", [{ path: "title", message: "Required" }]))).toBe("Validation failed: title – Required");
    expect(errorMessage(new AdminApiError(409, "A record with this slug already exists"))).toBe("A record with this slug already exists");
    expect(errorMessage(new AdminApiError(401, "Invalid email or password"))).toBe("Invalid email or password");
  });
  it("never exposes server internals", () => {
    expect(errorMessage(new AdminApiError(500, "MongoServerError: E11000 at db.tours"))).not.toMatch(/Mongo|E11000/);
    expect(errorMessage(new AdminApiError(502, "Media service error: api_secret mismatch", [], "CLOUDINARY_ERROR"))).not.toMatch(/api_secret/);
    expect(errorMessage(new AdminApiError(404, "Route not found: GET /api/admin/x"))).not.toMatch(/Route not found/);
  });
  it("maps rate limits, permissions and network failures", () => {
    expect(errorMessage(new AdminApiError(429, "Too many requests"))).toMatch(/wait/i);
    expect(errorMessage(new AdminApiError(403, "Origin not allowed"))).toMatch(/permission/i);
    expect(errorMessage(new AdminApiError(0, "x", [], "NETWORK"))).toMatch(/connection/i);
    expect(errorMessage(new TypeError("Failed to fetch"))).toMatch(/connection/i);
  });
});

describe("public form submission", () => {
  afterEach(() => vi.unstubAllGlobals());
  const respond = (status: number, body: unknown) => vi.stubGlobal("fetch", vi.fn(async () => new Response(JSON.stringify(body), { status })));

  it("reports network failures as status 0", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => Promise.reject(new TypeError("Failed to fetch"))));
    const res = await submitPublic("/contact", {});
    expect(res).toMatchObject({ ok: false, status: 0, errors: [] });
  });
  it("only passes field errors through for validation failures", async () => {
    respond(400, { success: false, message: "Validation failed", errors: [{ path: "email", message: "Invalid email" }] });
    expect((await submitPublic("/contact", {})).errors).toHaveLength(1);
    respond(500, { success: false, message: "boom", errors: [{ path: "internal", message: "stack" }] });
    expect(await submitPublic("/contact", {})).toMatchObject({ ok: false, status: 500, errors: [] });
  });
  it("returns data on success", async () => {
    respond(201, { success: true, message: "ok", data: { reference: "BK-1" } });
    expect(await submitPublic<{ reference: string }>("/bookings", {})).toMatchObject({ ok: true, status: 201, data: { reference: "BK-1" } });
  });
});

describe("admin route permissions", () => {
  it("derives content permissions from the resource config", () => {
    expect(routePermission("/admin/content/tours")).toBe("tours:read");
    expect(routePermission("/admin/content/tours/new")).toBe("tours:create");
    expect(routePermission("/admin/content/guest-shorts/0123456789abcdef01234567")).toBe("guestShorts:read");
  });
  it("uses the most specific sidebar link for other pages", () => {
    expect(routePermission("/admin/bookings/abc")).toBe("bookings:read");
    expect(routePermission("/admin/pages/home")).toBe("pages:read");
    expect(routePermission("/admin/users")).toBe("users:read");
    expect(routePermission("/admin/translations/editor")).toBe("translations:read");
  });
  it("leaves the dashboard and own-account pages open", () => {
    expect(routePermission("/admin")).toBeNull();
    expect(routePermission("/admin/system/security")).toBeNull();
  });
});

describe("guest shorts form", () => {
  const fields = RESOURCES["guest-shorts"].sections.flatMap((s) => s.fields);
  const field = (name: string) => fields.find((f) => f.name === name) as FieldDef;
  const validate = (name: string, values: Record<string, unknown>) =>
    (fieldRules(field(name), name).validate as (v: unknown, all: Record<string, unknown>) => true | string)(values[name], values);

  it("requires an external URL for YouTube / Instagram / TikTok, not an upload", () => {
    for (const platform of ["youtube", "instagram", "tiktok"]) {
      expect(validate("videoUrl", { platform, videoUrl: "" })).toMatch(/required/);
      expect(validate("videoUrl", { platform, videoUrl: "youtube.com/x" })).toMatch(/https/);
      expect(validate("videoUrl", { platform, videoUrl: "https://youtube.com/shorts/abc" })).toBe(true);
      expect(validate("uploadedMedia", { platform, uploadedMedia: null })).toBe(true);
    }
  });
  it("requires an uploaded video for platform = upload, not a URL", () => {
    expect(validate("uploadedMedia", { platform: "upload", uploadedMedia: null })).toMatch(/required/);
    expect(validate("uploadedMedia", { platform: "upload", uploadedMedia: { url: "" } })).toMatch(/required/);
    expect(validate("uploadedMedia", { platform: "upload", uploadedMedia: { url: "https://res.cloudinary.com/x/video/upload/a.mp4" } })).toBe(true);
    expect(validate("videoUrl", { platform: "upload", videoUrl: "" })).toBe(true);
  });
  it("clears the hidden source on save", () => {
    const media = { url: "https://res.cloudinary.com/x/video/upload/a.mp4" };
    expect(fromFormValues(fields, { platform: "upload", videoUrl: "https://youtu.be/x", uploadedMedia: media })).toMatchObject({ videoUrl: "", uploadedMedia: media });
    expect(fromFormValues(fields, { platform: "youtube", videoUrl: "https://youtu.be/x", uploadedMedia: media })).toMatchObject({ videoUrl: "https://youtu.be/x", uploadedMedia: null });
  });
});

describe("CMS field rules", () => {
  const run = (f: FieldDef, v: unknown) => (fieldRules(f, f.name).validate as (v: unknown, all: object) => true | string)(v, {});
  it("validates slugs, numbers and optional URLs", () => {
    expect(run({ name: "slug", label: "Slug", type: "slug" }, "ella-rock")).toBe(true);
    expect(run({ name: "slug", label: "Slug", type: "slug" }, "Ella Rock")).toMatch(/lowercase/);
    expect(run({ name: "rating", label: "Rating", type: "number", min: 1, max: 5 }, 6)).toMatch(/at most 5/);
    expect(run({ name: "sourceUrl", label: "Source", type: "url" }, "")).toBe(true);
    expect(run({ name: "title", label: "Title", type: "text", required: true }, "   ")).toMatch(/required/);
  });
});
