import { afterEach, describe, expect, it, vi } from "vitest";
import { api, getAllOptions } from "@/lib/admin/api";

afterEach(() => vi.restoreAllMocks());

describe("admin relation pagination", () => {
  it("loads options beyond the first 100 and preserves category filters", async () => {
    const get = vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: [{ _id: "first" }], message: "OK", meta: { page: 1, limit: 100, total: 101, totalPages: 2 } })
      .mockResolvedValueOnce({ data: [{ _id: "last" }], message: "OK" });
    expect(await getAllOptions("/admin/categories", { kind: "tour" })).toEqual([{ _id: "first" }, { _id: "last" }]);
    expect(get.mock.calls.map(([url]) => new URL(url, "http://test").searchParams.get("page"))).toEqual(["1", "2"]);
    for (const [url] of get.mock.calls) expect(new URL(url, "http://test").searchParams.get("kind")).toBe("tour");
  });
  it("handles unpaginated endpoints without repeating requests", async () => {
    const get = vi.spyOn(api, "get").mockResolvedValue({ data: [], message: "OK" });
    expect(await getAllOptions("/admin/navigation")).toEqual([]);
    expect(get).toHaveBeenCalledTimes(1);
  });
  it("reports a later-page failure instead of presenting an incomplete list", async () => {
    vi.spyOn(api, "get")
      .mockResolvedValueOnce({ data: [], message: "OK", meta: { page: 1, limit: 100, total: 101, totalPages: 2 } })
      .mockRejectedValueOnce(new Error("API unavailable"));
    await expect(getAllOptions("/admin/tours")).rejects.toThrow("API unavailable");
  });
});
