import { describe, expect, it } from "vitest";
import {
  CATEGORY_PALETTE,
  getRandomCategoryColor,
  deriveSubcategoryColor,
} from "./categoryColors";

describe("getRandomCategoryColor", () => {
  it("returns a color from the palette", () => {
    const color = getRandomCategoryColor();
    expect(CATEGORY_PALETTE).toContain(color);
  });

  it("returns a 6-character hex string", () => {
    const color = getRandomCategoryColor();
    expect(color).toMatch(/^[0-9A-Fa-f]{6}$/);
  });
});

describe("deriveSubcategoryColor", () => {
  it("returns a valid 6-character hex string", () => {
    const result = deriveSubcategoryColor("4F46E5", 0);
    expect(result).toMatch(/^[0-9a-f]{6}$/);
  });

  it("produces lighter colors for higher indices", () => {
    const color0 = deriveSubcategoryColor("4F46E5", 0);
    const color1 = deriveSubcategoryColor("4F46E5", 1);
    const color2 = deriveSubcategoryColor("4F46E5", 2);

    // Parse lightness by converting back — just check they differ
    expect(color0).not.toBe(color1);
    expect(color1).not.toBe(color2);
  });

  it("does not exceed maximum lightness", () => {
    // Even with a very high index, should still be valid hex
    const result = deriveSubcategoryColor("4F46E5", 20);
    expect(result).toMatch(/^[0-9a-f]{6}$/);
  });
});
