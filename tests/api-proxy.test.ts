import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { unstable_doesMiddlewareMatch } from "next/experimental/testing/server";

// next-intl's ESM build does not load under plain Node; locale routing is not under test here.
vi.mock("next-intl/middleware", () => ({ default: () => () => new Response(null, { headers: { "x-intl": "1" } }) }));

const BACKEND = "https://api.example.test/api";

/** config.ts reads the environment when it is first imported, so each case re-imports it. */
async function load<T>(path: string, env: Record<string, string | undefined> = {}): Promise<T> {
  vi.resetModules();
  vi.stubEnv("NEXT_PUBLIC_API_URL", `${BACKEND}/`);
  for (const [key, value] of Object.entries(env)) vi.stubEnv(key, value);
  return (await import(path)) as T;
}

afterEach(() => {
  vi.unstubAllEnvs();
});

describe("API base URL", () => {
  type Config = typeof import("../src/lib/config");

  it("sends browser calls through the same-origin /api proxy by default", async () => {
    const config = await load<Config>("../src/lib/config");
    expect(config.API_URL).toBe("/api");
    expect(config.BACKEND_API_URL).toBe(BACKEND);
    expect(config.SERVER_API_URL).toBe(BACKEND);
  });

  it("calls the API directly when the proxy is switched off", async () => {
    const config = await load<Config>("../src/lib/config", { NEXT_PUBLIC_API_PROXY: "false" });
    expect(config.API_URL).toBe(BACKEND);
  });

  it("server-side calls prefer the private API URL", async () => {
    const config = await load<Config>("../src/lib/config", { API_URL_INTERNAL: "http://backend:5000/api" });
    expect(config.SERVER_API_URL).toBe("http://backend:5000/api");
    expect(config.API_URL).toBe("/api");
  });
});

describe("next.config /api rewrite", () => {
  type Rewrites = { beforeFiles: unknown[]; afterFiles: { source: string; destination: string }[]; fallback: unknown[] };
  type NextConfigModule = { default: { rewrites: () => Promise<Rewrites>; headers: () => Promise<{ source: string; headers: { key: string; value: string }[] }[]> } };

  it("forwards /api/* to the API after this app's own routes", async () => {
    const { default: nextConfig } = await load<NextConfigModule>("../next.config");
    const rewrites = await nextConfig.rewrites();
    expect(rewrites.beforeFiles).toEqual([]);
    expect(rewrites.afterFiles).toEqual([{ source: "/api/:path*", destination: `${BACKEND}/:path*` }]);
    const headers = await nextConfig.headers();
    expect(headers).toContainEqual({ source: "/api/:path*", headers: [{ key: "x-vercel-enable-rewrite-caching", value: "0" }] });
  });

  it("has no rewrite when the proxy is switched off", async () => {
    const { default: nextConfig } = await load<NextConfigModule>("../next.config", { NEXT_PUBLIC_API_PROXY: "false" });
    expect((await nextConfig.rewrites()).afterFiles).toEqual([]);
  });
});

describe("proxy.ts client-IP forwarding", () => {
  type ProxyModule = typeof import("../src/proxy");
  let mod: ProxyModule;

  beforeEach(async () => {
    mod = await load<ProxyModule>("../src/proxy", { API_PROXY_SECRET: "s".repeat(40) });
  });

  const request = (path: string, headers: Record<string, string> = {}) => new NextRequest(`https://site.example.test${path}`, { headers });
  /** Request headers the proxy forwards upstream (Next encodes them as x-middleware-request-* response headers). */
  const forwarded = (res: Response) => {
    const names = (res.headers.get("x-middleware-override-headers") ?? "").split(",").filter(Boolean);
    return Object.fromEntries(names.map((n) => [n, res.headers.get(`x-middleware-request-${n}`)]));
  };

  it("adds the secret and the platform-provided visitor IP", () => {
    const out = forwarded(mod.default(request("/api/auth/login", { "x-real-ip": "198.51.100.7" })) as Response);
    expect(out["x-sltd-client-ip"]).toBe("198.51.100.7");
    expect(out["x-sltd-proxy-secret"]).toBe("s".repeat(40));
  });

  it("replaces client-supplied copies of the trusted headers", () => {
    const res = mod.default(request("/api/auth/login", { "x-real-ip": "198.51.100.7", "x-sltd-client-ip": "203.0.113.1", "x-sltd-proxy-secret": "guess" }));
    const out = forwarded(res as Response);
    expect(out["x-sltd-client-ip"]).toBe("198.51.100.7");
    expect(out["x-sltd-proxy-secret"]).toBe("s".repeat(40));
  });

  it("drops client-supplied trusted headers when no secret is configured", async () => {
    mod = await load<ProxyModule>("../src/proxy", { API_PROXY_SECRET: "" });
    const out = forwarded(mod.default(request("/api/auth/login", { "x-real-ip": "198.51.100.7", "x-sltd-client-ip": "203.0.113.1", "x-sltd-proxy-secret": "guess" })) as Response);
    expect(out).not.toHaveProperty("x-sltd-client-ip");
    expect(out).not.toHaveProperty("x-sltd-proxy-secret");
  });

  it.each([
    ["/api/auth/me", true],
    ["/api/customer/auth/refresh", true],
    ["/api/admin/media/signature", true],
    ["/api/currency", false],
    ["/api/revalidate", false],
    ["/api/admin/media/upload", false],
    ["/api/admin/media/abc123/replace", false],
    ["/en/tours", true],
    ["/admin/login", false],
  ])("matcher: %s → %s", (url, expected) => {
    expect(unstable_doesMiddlewareMatch({ config: mod.config, url })).toBe(expected);
  });
});
