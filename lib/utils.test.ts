import { describe, expect, it } from "vitest";

import { cn, currency } from "./utils";

describe("cn", () => {
  it("merges class names", () => {
    expect(cn("foo", "bar")).toBe("foo bar");
  });

  it("handles conditional classes", () => {
    expect(cn("base", false && "hidden", "visible")).toBe("base visible");
  });

  it("resolves tailwind conflicts (last wins)", () => {
    expect(cn("p-4", "p-2")).toBe("p-2");
  });

  it("handles empty inputs", () => {
    expect(cn()).toBe("");
  });
});

describe("currency", () => {
  it("formats USD in en-US locale", () => {
    const formatter = currency("en-US", "USD");
    const formatted = formatter.format(1234.56);
    expect(formatted).toContain("1,234.56");
    expect(formatted).toContain("$");
  });

  it("formats EUR in es-ES locale", () => {
    const formatter = currency("es-ES", "EUR");
    const formatted = formatter.format(1234.56);
    expect(formatted).toContain("1234,56");
    expect(formatted).toContain("€");
  });

  it("formats zero correctly", () => {
    const formatter = currency("en-US", "USD");
    const formatted = formatter.format(0);
    expect(formatted).toContain("0.00");
  });

  it("formats negative amounts", () => {
    const formatter = currency("en-US", "USD");
    const formatted = formatter.format(-500);
    expect(formatted).toContain("500.00");
  });
});
