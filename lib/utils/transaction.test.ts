import { describe, expect, it } from "vitest";

import {
  computeTransactionAmount,
  computeTaxAmount,
  computeTotalTax,
  convertFormTaxLines,
  nextTimeIncrement,
} from "./transaction";

describe("computeTransactionAmount", () => {
  it("negates amount for EXPENSE", () => {
    expect(computeTransactionAmount("EXPENSE", 50)).toBe(-50);
  });

  it("negates amount for EXPENSE even if already negative", () => {
    expect(computeTransactionAmount("EXPENSE", -50)).toBe(-50);
  });

  it("negates amount for EXPENSE_N", () => {
    expect(computeTransactionAmount("EXPENSE_N", 30)).toBe(-30);
  });

  it("negates amount for TRANSFER", () => {
    expect(computeTransactionAmount("TRANSFER", 100)).toBe(-100);
  });

  it("makes amount positive for INCOME", () => {
    expect(computeTransactionAmount("INCOME", 75)).toBe(75);
  });

  it("makes amount positive for INCOME even if negative input", () => {
    expect(computeTransactionAmount("INCOME", -75)).toBe(75);
  });

  it("makes amount positive for INCOME_N", () => {
    expect(computeTransactionAmount("INCOME_N", 40)).toBe(40);
  });

  it("preserves raw positive value for OPENING", () => {
    expect(computeTransactionAmount("OPENING", 500)).toBe(500);
  });

  it("preserves raw negative value for OPENING", () => {
    expect(computeTransactionAmount("OPENING", -200)).toBe(-200);
  });

  it("preserves zero for OPENING", () => {
    expect(computeTransactionAmount("OPENING", 0)).toBe(0);
  });

  it("handles zero amount for any type", () => {
    expect(computeTransactionAmount("EXPENSE", 0)).toBe(-0);
    expect(computeTransactionAmount("INCOME", 0)).toBe(0);
  });
});

describe("computeTaxAmount", () => {
  it("computes inclusive tax (21% on 121)", () => {
    // 121 includes 21% tax → tax = 121 * (21/121) = 21
    const tax = computeTaxAmount(21, 121, true);
    expect(tax).toBeCloseTo(21, 2);
  });

  it("computes inclusive tax (21% on 50)", () => {
    // 50 includes tax → tax = 50 * (21/121) ≈ 8.68
    const tax = computeTaxAmount(21, 50, true);
    expect(tax).toBeCloseTo(8.68, 2);
  });

  it("computes exclusive tax (21% on 100)", () => {
    // 100 + 21% = 21
    const tax = computeTaxAmount(21, 100, false);
    expect(tax).toBeCloseTo(21, 2);
  });

  it("computes exclusive tax (10% on 30)", () => {
    const tax = computeTaxAmount(10, 30, false);
    expect(tax).toBeCloseTo(3, 2);
  });

  it("computes inclusive tax (4% on 100)", () => {
    // 100 * (4/104) ≈ 3.85
    const tax = computeTaxAmount(4, 100, true);
    expect(tax).toBeCloseTo(3.85, 2);
  });

  it("computes tax with decimal rate (7.7%)", () => {
    const tax = computeTaxAmount(7.7, 100, false);
    expect(tax).toBeCloseTo(7.7, 2);
  });

  it("returns 0 when rate is 0", () => {
    expect(computeTaxAmount(0, 100, true)).toBe(0);
    expect(computeTaxAmount(0, 100, false)).toBe(0);
  });

  it("returns 0 when amount is 0", () => {
    expect(computeTaxAmount(21, 0, true)).toBe(0);
    expect(computeTaxAmount(21, 0, false)).toBe(0);
  });

  it("returns 0 when rate is negative", () => {
    expect(computeTaxAmount(-5, 100, true)).toBe(0);
  });

  it("returns 0 when amount is negative", () => {
    expect(computeTaxAmount(21, -50, false)).toBe(0);
  });
});

describe("computeTotalTax", () => {
  it("sums tax from multiple lines", () => {
    const lines = [
      { rate: "21", amount: "100", inclusive: false }, // 21
      { rate: "10", amount: "50", inclusive: false },  // 5
    ];
    expect(computeTotalTax(lines)).toBeCloseTo(26, 2);
  });

  it("handles mixed inclusive/exclusive lines", () => {
    const lines = [
      { rate: "21", amount: "121", inclusive: true },  // 21
      { rate: "10", amount: "30", inclusive: false },   // 3
    ];
    expect(computeTotalTax(lines)).toBeCloseTo(24, 2);
  });

  it("returns 0 for empty array", () => {
    expect(computeTotalTax([])).toBe(0);
  });

  it("skips null/undefined entries", () => {
    const lines = [
      { rate: "21", amount: "100", inclusive: false },
      null,
      undefined,
    ];
    expect(computeTotalTax(lines)).toBeCloseTo(21, 2);
  });

  it("handles lines with empty rate strings", () => {
    const lines = [
      { rate: "", amount: "100", inclusive: false },
    ];
    expect(computeTotalTax(lines)).toBe(0);
  });

  it("handles NaN from invalid strings", () => {
    const lines = [
      { rate: "abc", amount: "xyz", inclusive: true },
    ];
    expect(computeTotalTax(lines)).toBe(0);
  });
});

describe("convertFormTaxLines", () => {
  it("converts string values to numbers and computes taxAmount", () => {
    const result = convertFormTaxLines([
      { rate: "21", amount: "50", inclusive: true },
      { rate: "10", amount: "30", inclusive: false },
    ]);
    expect(result).toHaveLength(2);
    expect(result![0]).toEqual({
      rate: 21, amount: 50, inclusive: true,
      taxAmount: expect.closeTo(8.68, 1),
    });
    expect(result![1]).toEqual({
      rate: 10, amount: 30, inclusive: false,
      taxAmount: expect.closeTo(3, 1),
    });
  });

  it("returns null for empty array", () => {
    expect(convertFormTaxLines([])).toBeNull();
  });

  it("filters out lines with empty rate", () => {
    const result = convertFormTaxLines([
      { rate: "", amount: "50", inclusive: true },
      { rate: "21", amount: "100", inclusive: false },
    ]);
    expect(result).toEqual([
      { rate: 21, amount: 100, inclusive: false, taxAmount: expect.closeTo(21, 1) },
    ]);
  });

  it("returns null when all lines have empty rate", () => {
    const result = convertFormTaxLines([
      { rate: "", amount: "50", inclusive: true },
    ]);
    expect(result).toBeNull();
  });

  it("handles decimal rates", () => {
    const result = convertFormTaxLines([
      { rate: "7.7", amount: "100.50", inclusive: true },
    ]);
    expect(result).toEqual([
      { rate: 7.7, amount: 100.5, inclusive: true, taxAmount: expect.closeTo(7.18, 1) },
    ]);
  });
});

describe("nextTimeIncrement", () => {
  it("starts at 09:00 (540 minutes)", () => {
    const result = nextTimeIncrement(540);
    expect(result.time).toBe("09:00");
    expect(result.nextCounter).toBe(541);
  });

  it("increments to 09:01", () => {
    const result = nextTimeIncrement(541);
    expect(result.time).toBe("09:01");
    expect(result.nextCounter).toBe(542);
  });

  it("handles midnight boundary (23:59 → wraps to 540)", () => {
    const result = nextTimeIncrement(1439); // 23:59
    expect(result.time).toBe("23:59");
    expect(result.nextCounter).toBe(540);
  });

  it("pads single-digit hours and minutes", () => {
    const result = nextTimeIncrement(65); // 01:05
    expect(result.time).toBe("01:05");
  });

  it("handles 00:00", () => {
    const result = nextTimeIncrement(0);
    expect(result.time).toBe("00:00");
    expect(result.nextCounter).toBe(1);
  });

  it("handles 12:30", () => {
    const result = nextTimeIncrement(750); // 12*60 + 30
    expect(result.time).toBe("12:30");
    expect(result.nextCounter).toBe(751);
  });
});
