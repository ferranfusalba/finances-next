import { describe, expect, it } from "vitest";

import { getCurrencyColors, getCurrencyColor0, getCurrencyColor1 } from "./currency";

describe("getCurrencyColors", () => {
  it("returns an array of colors for USD", () => {
    const colors = getCurrencyColors("USD");
    expect(colors).toBeDefined();
    expect(Array.isArray(colors)).toBe(true);
    expect(colors!.length).toBeGreaterThanOrEqual(2);
  });

  it("returns an array of colors for EUR", () => {
    const colors = getCurrencyColors("EUR");
    expect(colors).toBeDefined();
    expect(Array.isArray(colors)).toBe(true);
  });

  it("returns undefined for invalid currency code", () => {
    expect(getCurrencyColors("INVALID")).toBeUndefined();
  });
});

describe("getCurrencyColor0", () => {
  it("returns first color for USD", () => {
    const color = getCurrencyColor0("USD");
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });

  it("returns first color for EUR", () => {
    const color = getCurrencyColor0("EUR");
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });
});

describe("getCurrencyColor1", () => {
  it("returns second color for USD", () => {
    const color = getCurrencyColor1("USD");
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });

  it("returns second color for EUR", () => {
    const color = getCurrencyColor1("EUR");
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });
});

describe("edge cases", () => {
  it("returns undefined for invalid currency code for getCurrencyColor0", () => {
    expect(getCurrencyColor0("INVALID")).toBeUndefined();
  });

  it("returns undefined for invalid currency code for getCurrencyColor1", () => {
    expect(getCurrencyColor1("INVALID")).toBeUndefined();
  });
});
