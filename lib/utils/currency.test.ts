import { describe, expect, it } from "vitest";

import { getCurrencyColor0, getCurrencyColor1 } from "./currency";

describe("getCurrencyColor0", () => {
  it("returns a color for USD", () => {
    const color = getCurrencyColor0("USD");
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });

  it("returns a color for EUR", () => {
    const color = getCurrencyColor0("EUR");
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });
});

describe("getCurrencyColor1", () => {
  it("returns a color for USD", () => {
    const color = getCurrencyColor1("USD");
    expect(color).toBeDefined();
    expect(typeof color).toBe("string");
  });

  it("returns a color for EUR", () => {
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
