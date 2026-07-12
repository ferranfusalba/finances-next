import { describe, expect, it } from "vitest";

import { accountLabel, uniqueBankNames } from "./account";

describe("accountLabel", () => {
  const invested = {
    id: "inv",
    bankName: "Indexa Capital",
    name: "Fondos 2",
    type: "INVESTMENT" as const,
  };
  const cash = {
    id: "cash",
    bankName: "Indexa Capital",
    name: "Cash",
    type: "INVESTMENT_CASH" as const,
    parentAccountId: "inv",
  };
  const solo = {
    id: "solo",
    bankName: "Indexa Capital",
    name: "Pensiones",
    type: "INVESTMENT" as const,
  };
  const checking = {
    id: "chk",
    bankName: "Ibercaja",
    name: "Cuenta Vamos",
    type: "CHECKING" as const,
  };
  const all = [invested, cash, solo, checking];

  it("names an ordinary account bank-then-account", () => {
    expect(accountLabel(checking, all)).toBe("Ibercaja · Cuenta Vamos");
  });

  it("names a cash leg through its parent", () => {
    // "Indexa Capital · Cash" tells you nothing about *which* investment's cash
    // it is — and two funds at the same provider would both be called that.
    expect(accountLabel(cash, all)).toBe("Indexa Capital · Fondos 2 (Cash)");
  });

  it("names the invested leg of a split pair as such", () => {
    // Sitting next to "Fondos 2 (Cash)" in a picker, a plain "Fondos 2" reads as
    // the whole account rather than one half of it — which is how you end up
    // transferring into the wrong leg.
    expect(accountLabel(invested, all)).toBe(
      "Indexa Capital · Fondos 2 (Invested)",
    );
  });

  it("leaves an investment with no cash leg plainly named", () => {
    // One leg, nothing to tell it apart from.
    expect(accountLabel(solo, all)).toBe("Indexa Capital · Pensiones");
  });

  it("takes a separator, because pickers use a dash and tables a dot", () => {
    expect(accountLabel(cash, all, "-")).toBe(
      "Indexa Capital - Fondos 2 (Cash)",
    );
  });

  it("falls back to the plain name when the parent is not in the list", () => {
    // A partial account list (a picker that filters, say) must not produce
    // "undefined (Cash)".
    expect(accountLabel(cash, [cash])).toBe("Indexa Capital · Cash");
  });
});

describe("uniqueBankNames", () => {
  it("de-duplicates and sorts", () => {
    expect(
      uniqueBankNames([
        { bankName: "N26" },
        { bankName: "BBVA" },
        { bankName: "N26" },
      ]),
    ).toEqual(["BBVA", "N26"]);
  });

  it("treats a different casing as the same bank, keeping the first spelling", () => {
    // "BBVA" and "bbva" are the same bank. Offering both would defeat the point
    // of the picker, which exists so a typo cannot silently split one bank in two.
    expect(
      uniqueBankNames([{ bankName: "BBVA" }, { bankName: "bbva" }]),
    ).toEqual(["BBVA"]);
  });

  it("ignores blank and whitespace-only names", () => {
    expect(
      uniqueBankNames([
        { bankName: "" },
        { bankName: "   " },
        { bankName: "N26" },
      ]),
    ).toEqual(["N26"]);
  });

  it("trims surrounding whitespace", () => {
    expect(uniqueBankNames([{ bankName: "  N26  " }])).toEqual(["N26"]);
  });

  it("returns nothing for a user with no accounts", () => {
    expect(uniqueBankNames([])).toEqual([]);
  });
});
