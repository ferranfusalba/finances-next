import { describe, expect, it } from "vitest";
import { Prisma } from "@prisma/client";

import { cn, currency, toNumber } from "./utils";

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

describe("toNumber", () => {
  it("returns 0 for null", () => {
    expect(toNumber(null)).toBe(0);
  });

  it("returns 0 for undefined", () => {
    expect(toNumber(undefined)).toBe(0);
  });

  it("passes through a plain number", () => {
    expect(toNumber(42)).toBe(42);
    expect(toNumber(-3.14)).toBe(-3.14);
    expect(toNumber(0)).toBe(0);
  });

  it("converts Prisma.Decimal to number", () => {
    const decimal = new Prisma.Decimal("1234.56");
    expect(toNumber(decimal)).toBe(1234.56);
  });

  it("converts negative Prisma.Decimal to number", () => {
    const decimal = new Prisma.Decimal("-99.99");
    expect(toNumber(decimal)).toBe(-99.99);
  });

  it("converts zero Prisma.Decimal to number", () => {
    const decimal = new Prisma.Decimal("0");
    expect(toNumber(decimal)).toBe(0);
  });
});
