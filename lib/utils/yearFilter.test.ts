import { describe, expect, it } from "vitest";
import { parseYearParam, buildDateTimeFilter } from "./yearFilter";

describe("parseYearParam", () => {
  it("returns null for undefined", () => {
    expect(parseYearParam(undefined)).toBeNull();
  });

  it("returns null for 'all'", () => {
    expect(parseYearParam("all")).toBeNull();
  });

  it("returns null for empty string", () => {
    expect(parseYearParam("")).toBeNull();
  });

  it("returns null for non-numeric string", () => {
    expect(parseYearParam("abc")).toBeNull();
  });

  it("returns null for year below 1900", () => {
    expect(parseYearParam("1899")).toBeNull();
  });

  it("returns null for year above 2100", () => {
    expect(parseYearParam("2101")).toBeNull();
  });

  it("parses valid year", () => {
    expect(parseYearParam("2025")).toBe(2025);
  });

  it("parses boundary years", () => {
    expect(parseYearParam("1900")).toBe(1900);
    expect(parseYearParam("2100")).toBe(2100);
  });
});

describe("buildDateTimeFilter", () => {
  it("returns undefined for null year", () => {
    expect(buildDateTimeFilter(null)).toBeUndefined();
  });

  it("returns correct date range for a year", () => {
    const filter = buildDateTimeFilter(2025);
    expect(filter).toEqual({
      gte: new Date("2025-01-01T00:00:00.000Z"),
      lt: new Date("2026-01-01T00:00:00.000Z"),
    });
  });

  it("returns correct date range for leap year", () => {
    const filter = buildDateTimeFilter(2024);
    expect(filter).toEqual({
      gte: new Date("2024-01-01T00:00:00.000Z"),
      lt: new Date("2025-01-01T00:00:00.000Z"),
    });
  });
});
