import { describe, expect, it } from "vitest";
import { bookingSchema } from "@/validations/public";

const messages = {
  required: "required",
  email: "email",
  minLength: (n: number) => `min ${n}`,
  min: (n: number) => `min ${n}`,
  future: "future",
  after: "after",
  select: "select",
};
const schema = bookingSchema(messages);
const nextYear = `${new Date().getFullYear() + 1}-01-10`;
const base = { type: "general" as const, customer: { name: "Test Guest", email: "guest@example.com" }, startDate: nextYear, adults: 2 };
const ageIssues = (values: object) => {
  const r = schema.safeParse({ ...base, ...values });
  return r.success ? [] : r.error.issues.filter((i) => i.path[0] === "childrenAges").map((i) => i.path.join("."));
};

describe("booking children's ages", () => {
  it("needs no ages without children", () => {
    expect(ageIssues({ children: 0 })).toEqual([]);
    expect(ageIssues({})).toEqual([]);
  });

  it("asks for an age for every child", () => {
    expect(ageIssues({ children: 2, childrenAges: [5, Number.NaN] })).toEqual(["childrenAges.1"]);
    expect(ageIssues({ children: 2 })).toEqual(["childrenAges.0", "childrenAges.1"]);
    expect(ageIssues({ children: 2, childrenAges: [0, 17] })).toEqual([]);
  });

  it("ignores ages left over after the number of children went down", () => {
    expect(ageIssues({ children: 1, childrenAges: [4, Number.NaN] })).toEqual([]);
  });

  it("rejects ages outside 0–17", () => {
    expect(ageIssues({ children: 1, childrenAges: [18] })).toEqual(["childrenAges.0"]);
  });
});
