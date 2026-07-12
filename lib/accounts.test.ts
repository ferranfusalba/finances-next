import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    accountTransaction: {
      findFirst: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { checkOpeningDateInvariant, rollUpBalance } from "./accounts";

describe("rollUpBalance", () => {
  const invested = { defaultCurrency: "EUR", currentBalance: 10_000 };

  it("adds the cash leg to the invested position", () => {
    // The number you reconcile against the provider's statement is the invested
    // position plus the cash they are holding for you.
    expect(
      rollUpBalance(invested, [{ defaultCurrency: "EUR", currentBalance: 250 }]),
    ).toBe(10_250);
  });

  it("returns the account's own balance when it has no children", () => {
    expect(rollUpBalance(invested, [])).toBe(10_000);
  });

  it("subtracts a negative cash leg rather than ignoring its sign", () => {
    expect(
      rollUpBalance(invested, [{ defaultCurrency: "EUR", currentBalance: -40 }]),
    ).toBe(9_960);
  });

  it("refuses to add a leg in a different currency", () => {
    // Adding USD to EUR would be a lie dressed up as a total.
    expect(
      rollUpBalance(invested, [
        { defaultCurrency: "USD", currentBalance: 500 },
        { defaultCurrency: "EUR", currentBalance: 250 },
      ]),
    ).toBe(10_250);
  });
});

const OPENING_AT = new Date("2024-01-01T00:00:00Z");
const EARLIEST_TX_AT = new Date("2024-03-01T00:00:00Z");

describe("checkOpeningDateInvariant", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("an ordinary transaction against an existing opening", () => {
    beforeEach(() => {
      vi.mocked(db.accountTransaction.findFirst).mockResolvedValue({
        dateTime: OPENING_AT,
      } as never);
    });

    it("rejects a transaction dated before the opening", async () => {
      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "EXPENSE",
        dateTime: new Date("2023-12-31T23:59:59Z"),
      });

      expect(error).toMatch(/cannot be dated before/);
    });

    it("rejects a transaction dated exactly on the opening", async () => {
      // Strictly after. A same-instant transaction has no defined order against
      // the opening, and the running balance is computed by walking the rows in
      // date order.
      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "EXPENSE",
        dateTime: OPENING_AT,
      });

      expect(error).toMatch(/cannot be dated before/);
    });

    it("allows a transaction dated after the opening", async () => {
      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "EXPENSE",
        dateTime: new Date("2024-01-01T00:00:01Z"),
      });

      expect(error).toBeNull();
    });

    it("accepts an ISO string as well as a Date", async () => {
      // The API takes `z.string().or(z.date())`, so both reach this function.
      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "EXPENSE",
        dateTime: "2023-06-01T00:00:00.000Z",
      });

      expect(error).toMatch(/cannot be dated before/);
    });
  });

  describe("an opening against existing transactions", () => {
    beforeEach(() => {
      vi.mocked(db.accountTransaction.findFirst).mockResolvedValue({
        dateTime: EARLIEST_TX_AT,
      } as never);
    });

    it("rejects an opening dated after the earliest transaction", async () => {
      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "OPENING",
        dateTime: new Date("2024-06-01T00:00:00Z"),
      });

      expect(error).toMatch(/must be dated before/);
    });

    it("rejects an opening dated exactly on the earliest transaction", async () => {
      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "OPENING",
        dateTime: EARLIEST_TX_AT,
      });

      expect(error).toMatch(/must be dated before/);
    });

    it("allows an opening dated before the earliest transaction", async () => {
      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "OPENING",
        dateTime: new Date("2024-02-29T23:59:59Z"),
      });

      expect(error).toBeNull();
    });

    it("never compares the opening against other OPENING rows", async () => {
      await checkOpeningDateInvariant({
        accountId: "a1",
        type: "OPENING",
        dateTime: OPENING_AT,
      });

      const where = vi.mocked(db.accountTransaction.findFirst).mock.calls[0][0]
        ?.where;
      expect(where).toMatchObject({ type: { not: "OPENING" } });
    });
  });

  describe("editing", () => {
    it("excludes the row being edited from the comparison", async () => {
      // Moving an opening earlier must not fail against its own old date.
      vi.mocked(db.accountTransaction.findFirst).mockResolvedValue(null as never);

      await checkOpeningDateInvariant({
        accountId: "a1",
        type: "OPENING",
        dateTime: OPENING_AT,
        excludeTransactionId: "tx-1",
      });

      const where = vi.mocked(db.accountTransaction.findFirst).mock.calls[0][0]
        ?.where;
      expect(where).toMatchObject({ id: { not: "tx-1" } });
    });
  });

  describe("an account with no opening yet", () => {
    it("permits any transaction date", async () => {
      // Two accounts in the dev DB predate the compulsory opening. Their
      // transactions must keep working until the banner is answered.
      vi.mocked(db.accountTransaction.findFirst).mockResolvedValue(null as never);

      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "EXPENSE",
        dateTime: new Date("1999-01-01T00:00:00Z"),
      });

      expect(error).toBeNull();
    });

    it("permits an opening at any date on an empty account", async () => {
      vi.mocked(db.accountTransaction.findFirst).mockResolvedValue(null as never);

      const error = await checkOpeningDateInvariant({
        accountId: "a1",
        type: "OPENING",
        dateTime: new Date("2030-01-01T00:00:00Z"),
      });

      expect(error).toBeNull();
    });
  });
});
