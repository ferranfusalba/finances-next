import { describe, expect, it } from "vitest";

import { getCountryFlag, getCountryName } from "./country";

describe("getCountryFlag", () => {
  it("returns the flag emoji for US", () => {
    expect(getCountryFlag("US")).toBe("🇺🇸");
  });

  it("returns the flag emoji for ES", () => {
    expect(getCountryFlag("ES")).toBe("🇪🇸");
  });

  it("returns the flag emoji for GB", () => {
    expect(getCountryFlag("GB")).toBe("🇬🇧");
  });
});

describe("getCountryName", () => {
  it("returns the name for US", () => {
    expect(getCountryName("US")).toBe("United States");
  });

  it("returns the name for ES", () => {
    expect(getCountryName("ES")).toBe("Spain");
  });

  it("returns the name for GB", () => {
    expect(getCountryName("GB")).toBe("United Kingdom");
  });

  it("returns empty string on invalid country code", () => {
    expect(getCountryName("ZZ")).toBe("");
  });
});

describe("getCountryFlag - edge cases", () => {
  it("returns empty string on invalid country code", () => {
    expect(getCountryFlag("ZZ")).toBe("");
  });
});
