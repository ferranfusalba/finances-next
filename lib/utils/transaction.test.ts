import { describe, expect, it } from "vitest";

import { ACCOUNT_TYPES } from "./account";
import {
  allowedTransactionTypes,
  computeTransactionAmount,
  computeTaxAmount,
  computeTotalTax,
  convertFormTaxLines,
  decomposeInvestment,
  getNextTimeForDate,
  hasCounterpartyFields,
  isTransactionTypeAllowed,
  isMonthComplete,
  monthKey,
  nextTimeIncrement,
  pendingReturnPeriods,
  returnPeriodForMonth,
  selectableTransactionTypes,
  transactionBucket,
} from "./transaction";

describe("allowedTransactionTypes", () => {
  it.each(["CHECKING", "SAVINGS", "CASH", "PREPAID"] as const)(
    "allows only Income, Expense, Transfer and Opening on %s",
    (accountType) => {
      expect(allowedTransactionTypes(accountType).sort()).toEqual(
        ["EXPENSE", "INCOME", "OPENING", "TRANSFER"].sort(),
      );
    },
  );

  it("allows only market movement and transfers on INVESTMENT", () => {
    // The invested leg holds the position and nothing else. Fees, retenciones,
    // contributions and withdrawals all belong on the cash leg, which is where
    // the provider actually posts them.
    expect(allowedTransactionTypes("INVESTMENT").sort()).toEqual(
      ["OPENING", "RETURN", "ROUNDING", "TRANSFER"].sort(),
    );
  });

  it("allows the cash-leg types on INVESTMENT_CASH", () => {
    expect(allowedTransactionTypes("INVESTMENT_CASH").sort()).toEqual(
      [
        "OPENING",
        "TRANSFER",
        "CONTRIBUTION",
        "WITHDRAWAL",
        "FEE",
        "WITHHOLDING",
      ].sort(),
    );
  });

  it("keeps INVESTMENT_LEGACY exactly as it was before the split", () => {
    // The four existing accounts hold INCOME rows. Narrowing this would make the
    // API's type guard reject them on edit, locking real history behind a
    // validation error.
    expect(allowedTransactionTypes("INVESTMENT_LEGACY").sort()).toEqual(
      [
        "INCOME",
        "EXPENSE",
        "TRANSFER",
        "OPENING",
        "RETURN",
        "WITHHOLDING",
        "ROUNDING",
      ].sort(),
    );
  });

  it("does not let RETURN or ROUNDING onto an ordinary account", () => {
    for (const accountType of ["CHECKING", "SAVINGS", "CASH", "PREPAID"] as const) {
      for (const type of ["RETURN", "ROUNDING", "WITHHOLDING", "FEE"]) {
        expect(isTransactionTypeAllowed(accountType, type)).toBe(false);
      }
    }
  });

  it("does not let INCOME or EXPENSE onto either new investment leg", () => {
    // This is the narrowing the split buys: the sparse investment form is a
    // consequence of the type table, not a special case in the form.
    for (const accountType of ["INVESTMENT", "INVESTMENT_CASH"] as const) {
      expect(isTransactionTypeAllowed(accountType, "INCOME")).toBe(false);
      expect(isTransactionTypeAllowed(accountType, "EXPENSE")).toBe(false);
    }
  });

  it("keeps FEE, CONTRIBUTION and WITHDRAWAL off every non-cash account", () => {
    for (const accountType of ACCOUNT_TYPES) {
      if (accountType === "INVESTMENT_CASH") continue;
      for (const type of ["FEE", "CONTRIBUTION", "WITHDRAWAL"]) {
        expect(isTransactionTypeAllowed(accountType, type)).toBe(false);
      }
    }
  });

  it("lets every account type hold a TRANSFER", () => {
    // Both legs of the split are real accounts, so money moves between them —
    // and into them from your bank — through the ordinary mirror machinery.
    for (const accountType of ACCOUNT_TYPES) {
      expect(isTransactionTypeAllowed(accountType, "TRANSFER")).toBe(true);
    }
  });

  it("offers OPENING on every account type", () => {
    for (const accountType of ACCOUNT_TYPES) {
      expect(allowedTransactionTypes(accountType)).toContain("OPENING");
    }
  });

  it("denies everything for an unrecognised account type rather than throwing", () => {
    // Guards writes; a guard that throws on unexpected input is worse than one
    // that permits nothing.
    const unknown = "BANANA" as never;
    expect(allowedTransactionTypes(unknown)).toEqual([]);
    expect(isTransactionTypeAllowed(unknown, "INCOME")).toBe(false);
  });
});

describe("selectableTransactionTypes", () => {
  it("never offers OPENING — it is written at account creation, not picked", () => {
    for (const accountType of ACCOUNT_TYPES) {
      expect(selectableTransactionTypes(accountType)).not.toContain("OPENING");
    }
  });

  it("offers the ordinary types on CHECKING", () => {
    expect(selectableTransactionTypes("CHECKING")).toEqual([
      "INCOME",
      "EXPENSE",
      "TRANSFER",
    ]);
  });

  it("still allows OPENING server-side even though it is unselectable", () => {
    // The dropdown never shows it, but the row exists and must stay editable —
    // and the create-account route and the banner both write one.
    expect(isTransactionTypeAllowed("CHECKING", "OPENING")).toBe(true);
  });
});

describe("computeTransactionAmount", () => {
  it("negates amount for EXPENSE", () => {
    expect(computeTransactionAmount("EXPENSE", 50)).toBe(-50);
  });

  it("negates amount for EXPENSE even if already negative", () => {
    expect(computeTransactionAmount("EXPENSE", -50)).toBe(-50);
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

  it("forces a CONTRIBUTION positive — it is money going in", () => {
    expect(computeTransactionAmount("CONTRIBUTION", 500)).toBe(500);
    expect(computeTransactionAmount("CONTRIBUTION", -500)).toBe(500);
  });

  it("forces a WITHDRAWAL negative — it is money coming out", () => {
    expect(computeTransactionAmount("WITHDRAWAL", 500)).toBe(-500);
    expect(computeTransactionAmount("WITHDRAWAL", -500)).toBe(-500);
  });

  it("forces a FEE negative", () => {
    expect(computeTransactionAmount("FEE", 4.2)).toBe(-4.2);
    expect(computeTransactionAmount("FEE", -4.2)).toBe(-4.2);
  });
});

describe("transactionBucket", () => {
  it("gives FEE its own bucket rather than letting it fall into CONTRIBUTION", () => {
    // A fee is negative. Bucketed as a contribution it would read as money you
    // withdrew, understating what you have actually paid in.
    expect(transactionBucket("FEE")).toBe("FEE");
  });

  it("keeps market movement, tax and drift in separate buckets", () => {
    expect(transactionBucket("RETURN")).toBe("RETURN");
    expect(transactionBucket("WITHHOLDING")).toBe("WITHHOLDING");
    expect(transactionBucket("ROUNDING")).toBe("ROUNDING");
  });

  it("gives OPENING its own bucket rather than counting it as a contribution", () => {
    // An opening is an accumulated position that already contains years of past
    // returns. Counting it as a contribution would claim you paid in money the
    // market actually made.
    expect(transactionBucket("OPENING")).toBe("OPENING");
  });

  it("counts money-in and money-out as contributions", () => {
    // netContributions = CONTRIBUTION + WITHDRAWAL + TRANSFER, signed.
    expect(transactionBucket("CONTRIBUTION")).toBe("CONTRIBUTION");
    expect(transactionBucket("WITHDRAWAL")).toBe("CONTRIBUTION");
    expect(transactionBucket("TRANSFER")).toBe("CONTRIBUTION");
  });
});

describe("returnPeriodForMonth", () => {
  it("lands on the last day of the row's month", () => {
    // Every row implies the month it needs a return for, and the return is posted
    // at the end of that month.
    const period = returnPeriodForMonth(new Date(2026, 0, 5));

    expect(period.label).toBe("January 2026");
    expect(period.date.getMonth()).toBe(0);
    expect(period.date.getDate()).toBe(31);
  });

  it("gets February right, including in a leap year", () => {
    expect(returnPeriodForMonth(new Date(2026, 1, 2)).date.getDate()).toBe(28);
    expect(returnPeriodForMonth(new Date(2028, 1, 2)).date.getDate()).toBe(29);
  });

  it("accepts an ISO string, which is what the API returns", () => {
    expect(returnPeriodForMonth("2026-03-02T10:00:00.000Z").label).toBe(
      "March 2026",
    );
  });
});

describe("monthKey", () => {
  it("identifies the month a row falls in", () => {
    expect(monthKey(new Date(2026, 0, 5))).toBe("2026-01");
    expect(monthKey(new Date(2026, 11, 31))).toBe("2026-12");
  });

  it("puts two rows in the same month under the same key", () => {
    // This is what stops a month being offered a second return: the button shows
    // once across all the rows of a month, not once per row.
    expect(monthKey(new Date(2026, 0, 2))).toBe(monthKey(new Date(2026, 0, 28)));
  });
});

describe("pendingReturnPeriods", () => {
  const NOW = new Date(2026, 6, 12); // 12 Jul 2026
  const opening = { type: "OPENING", dateTime: new Date(2025, 11, 31) };

  it("lists every complete month after the opening when none are posted", () => {
    // The opening IS the position on 31 Dec, so December already contains its own
    // return — the first month to post is January. July is still running.
    const pending = pendingReturnPeriods([opening], NOW).map((p) => p.label);

    expect(pending).toEqual([
      "January 2026",
      "February 2026",
      "March 2026",
      "April 2026",
      "May 2026",
      "June 2026",
    ]);
  });

  it("drops months that already have a return", () => {
    const pending = pendingReturnPeriods(
      [
        opening,
        { type: "RETURN", dateTime: new Date(2026, 0, 31) },
        { type: "RETURN", dateTime: new Date(2026, 2, 31) },
      ],
      NOW,
    ).map((p) => p.label);

    expect(pending).toEqual([
      "February 2026",
      "April 2026",
      "May 2026",
      "June 2026",
    ]);
  });

  it("lists a month you made no contribution in — it still had a market", () => {
    // The case this exists for. February has no rows at all, but the fund moved,
    // and without a synthetic row there is nothing to hang the action on.
    const pending = pendingReturnPeriods(
      [
        opening,
        { type: "TRANSFER", dateTime: new Date(2026, 0, 5) },
        { type: "RETURN", dateTime: new Date(2026, 0, 31) },
      ],
      NOW,
    ).map((p) => p.label);

    expect(pending).toContain("February 2026");
  });

  it("is empty once every complete month is posted", () => {
    const posted = [0, 1, 2, 3, 4, 5].map((m) => ({
      type: "RETURN",
      dateTime: new Date(2026, m, 28),
    }));

    expect(pendingReturnPeriods([opening, ...posted], NOW)).toEqual([]);
  });

  it("never offers the month still running", () => {
    const pending = pendingReturnPeriods([opening], NOW).map((p) => p.label);

    expect(pending).not.toContain("July 2026");
  });

  it("is empty for an account with no opening — there is no month to start from", () => {
    expect(pendingReturnPeriods([], NOW)).toEqual([]);
  });
});

describe("isMonthComplete", () => {
  const NOW = new Date(2026, 6, 12); // 12 Jul 2026

  it("is false for the month still running — it has no return to post", () => {
    expect(isMonthComplete(new Date(2026, 6, 1), NOW)).toBe(false);
  });

  it("is true for the last finished month", () => {
    expect(isMonthComplete(new Date(2026, 5, 30), NOW)).toBe(true);
  });

  it("is true for months further back, and across a year boundary", () => {
    expect(isMonthComplete(new Date(2026, 0, 5), NOW)).toBe(true);
    expect(isMonthComplete(new Date(2025, 11, 31), NOW)).toBe(true);
  });
});

describe("decomposeInvestment", () => {
  it("sums to the balance, by construction", () => {
    const rows = [
      { type: "OPENING", amount: 15_858.77 },
      { type: "TRANSFER", amount: 3_000 },
      { type: "RETURN", amount: -369.92 },
      { type: "FEE", amount: -11.16 },
      { type: "WITHHOLDING", amount: -0.12 },
      { type: "ROUNDING", amount: -0.01 },
    ];

    const d = decomposeInvestment(rows);

    expect(d.opening).toBe(15_858.77);
    expect(d.netContributions).toBe(3_000);
    expect(d.totalReturn).toBe(-369.92);
    expect(d.totalFees).toBe(-11.16);
    expect(d.totalWithholding).toBe(-0.12);
    expect(d.roundingAdj).toBe(-0.01);

    const summed =
      d.opening +
      d.netContributions +
      d.totalReturn +
      d.totalFees +
      d.totalWithholding +
      d.roundingAdj;
    expect(d.balance).toBeCloseTo(summed, 10);
  });

  it("cancels the internal cash → invested hop across a pair", () => {
    // This is why cash → invested stays a TRANSFER rather than being retyped
    // CONTRIBUTION. Fed both legs, the internal move appears twice with opposite
    // signs and nets to nothing: you contributed 1.000, once — not twice.
    const cashLeg = [
      { type: "OPENING", amount: 0 },
      { type: "TRANSFER", amount: 1_000 }, // in from the bank
      { type: "TRANSFER", amount: -1_000 }, // out to the fund
    ];
    const investedLeg = [
      { type: "OPENING", amount: 0 },
      { type: "TRANSFER", amount: 1_000 }, // in from cash
      { type: "RETURN", amount: 50 },
    ];

    expect(decomposeInvestment(cashLeg).netContributions).toBe(0);
    expect(decomposeInvestment(investedLeg).netContributions).toBe(1_000);

    const pair = decomposeInvestment([...cashLeg, ...investedLeg]);
    expect(pair.netContributions).toBe(1_000);
    expect(pair.totalReturn).toBe(50);
    expect(pair.balance).toBe(1_050);
  });

  it("does not let a fee flatter the market return", () => {
    // The whole point of the split: fees leave the cash leg, returns happen on the
    // invested leg, so a bad month and a management charge cannot be confused.
    const d = decomposeInvestment([
      { type: "RETURN", amount: 100 },
      { type: "FEE", amount: -100 },
    ]);

    expect(d.totalReturn).toBe(100);
    expect(d.totalFees).toBe(-100);
    expect(d.balance).toBe(0);
  });

  it("nets a withdrawal off the contributions", () => {
    const d = decomposeInvestment([
      { type: "CONTRIBUTION", amount: 1_000 },
      { type: "WITHDRAWAL", amount: -250 },
    ]);

    expect(d.netContributions).toBe(750);
  });

  it("returns all zeroes for an account with no transactions", () => {
    const d = decomposeInvestment([]);

    expect(d.balance).toBe(0);
    expect(d.netContributions).toBe(0);
  });
});

describe("hasCounterpartyFields", () => {
  it("is true only for types that describe a dealing with someone else", () => {
    for (const type of ["INCOME", "EXPENSE", "TRANSFER", "OPENING"]) {
      expect(hasCounterpartyFields(type)).toBe(true);
    }
  });

  it("is false for types that describe the account's own mechanics", () => {
    // A market movement has no shop and no VAT; a contribution's counterparty is
    // the account itself.
    for (const type of [
      "RETURN",
      "ROUNDING",
      "FEE",
      "WITHHOLDING",
      "CONTRIBUTION",
      "WITHDRAWAL",
    ]) {
      expect(hasCounterpartyFields(type)).toBe(false);
    }
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

describe("getNextTimeForDate", () => {
  it("ignores the opening — it is the account's starting point, not part of the day", () => {
    // The opening sits at 00:00. Counting it would make the first real transaction
    // of the opening day default to 00:01 rather than to 09:00.
    const date = new Date(2026, 2, 12);

    expect(
      getNextTimeForDate(date, [
        { type: "OPENING", dateTime: new Date(2026, 2, 12, 0, 0) },
      ]),
    ).toBe("09:00");
  });

  it("still advances past a real transaction on the same day", () => {
    const date = new Date(2026, 2, 12);

    expect(
      getNextTimeForDate(date, [
        { type: "OPENING", dateTime: new Date(2026, 2, 12, 0, 0) },
        { type: "EXPENSE", dateTime: new Date(2026, 2, 12, 14, 30) },
      ]),
    ).toBe("14:31");
  });

  it("returns 09:00 when no transactions exist on the date", () => {
    const date = new Date(2026, 2, 8); // March 8, 2026
    expect(getNextTimeForDate(date, [])).toBe("09:00");
  });

  it("returns 09:00 when no transactions match the date", () => {
    const date = new Date(2026, 2, 8);
    const txs = [
      { dateTime: new Date(2026, 2, 7, 10, 30) }, // different day
      { dateTime: new Date(2026, 2, 9, 14, 0) },  // different day
    ];
    expect(getNextTimeForDate(date, txs)).toBe("09:00");
  });

  it("returns 1 minute after the latest transaction on that date", () => {
    const date = new Date(2026, 2, 8);
    const txs = [
      { dateTime: new Date(2026, 2, 8, 9, 0) },
      { dateTime: new Date(2026, 2, 8, 10, 30) },
      { dateTime: new Date(2026, 2, 8, 9, 45) },
    ];
    expect(getNextTimeForDate(date, txs)).toBe("10:31");
  });

  it("returns 1 minute after a single transaction", () => {
    const date = new Date(2026, 2, 8);
    const txs = [{ dateTime: new Date(2026, 2, 8, 14, 22) }];
    expect(getNextTimeForDate(date, txs)).toBe("14:23");
  });

  it("wraps to 09:00 when latest transaction is at 23:59", () => {
    const date = new Date(2026, 2, 8);
    const txs = [{ dateTime: new Date(2026, 2, 8, 23, 59) }];
    expect(getNextTimeForDate(date, txs)).toBe("09:00");
  });

  it("handles string dateTime values", () => {
    const date = new Date(2026, 2, 8);
    const txs = [
      { dateTime: new Date(2026, 2, 8, 11, 15).toISOString() },
    ];
    expect(getNextTimeForDate(date, txs)).toBe("11:16");
  });

  it("ignores transactions from other dates", () => {
    const date = new Date(2026, 2, 8);
    const txs = [
      { dateTime: new Date(2026, 2, 7, 23, 0) },
      { dateTime: new Date(2026, 2, 8, 12, 0) },
      { dateTime: new Date(2026, 2, 9, 8, 0) },
    ];
    expect(getNextTimeForDate(date, txs)).toBe("12:01");
  });
});
