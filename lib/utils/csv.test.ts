import { describe, expect, it } from "vitest";

import { escapeCsvField, transactionToRow, CSV_HEADERS } from "./csv";

import { AccountTransaction } from "@/types/Transaction";

describe("escapeCsvField", () => {
  it("returns empty string for null", () => {
    expect(escapeCsvField(null)).toBe("");
  });

  it("returns empty string for undefined", () => {
    expect(escapeCsvField(undefined)).toBe("");
  });

  it("returns string as-is when no special characters", () => {
    expect(escapeCsvField("hello")).toBe("hello");
  });

  it("returns number as string", () => {
    expect(escapeCsvField(42)).toBe("42");
  });

  it("wraps value with commas in double quotes", () => {
    expect(escapeCsvField("hello,world")).toBe('"hello,world"');
  });

  it("wraps value with newlines in double quotes", () => {
    expect(escapeCsvField("line1\nline2")).toBe('"line1\nline2"');
  });

  it("escapes double quotes by doubling them", () => {
    expect(escapeCsvField('say "hi"')).toBe('"say ""hi"""');
  });

  it("converts Date to ISO string", () => {
    const date = new Date("2025-03-15T10:30:00.000Z");
    expect(escapeCsvField(date)).toBe("2025-03-15T10:30:00.000Z");
  });

  it("handles Date with commas in ISO string (edge: won't happen but wraps if needed)", () => {
    // ISO dates don't contain commas, so this just verifies Date conversion
    const date = new Date("2025-01-01T00:00:00.000Z");
    expect(escapeCsvField(date)).toBe("2025-01-01T00:00:00.000Z");
  });
});

describe("transactionToRow", () => {
  const baseTx: AccountTransaction = {
    id: "tx-1",
    dateTime: new Date("2025-03-15T10:00:00.000Z"),
    timezone: "+1",
    payee: "Grocery Store",
    concept: "Weekly groceries",
    type: "EXPENSE",
    currency: "EUR",
    amount: -50.25,
    category: "Food",
    subcategory: "Groceries",
    notes: "Regular shopping",
    createdAt: new Date(),
    updatedAt: new Date(),
    accountId: "acc-1",
    tags: ["weekly"],
    location: { name: "Barcelona", address: "Barcelona, Spain", lat: 41.39, lng: 2.17, placeId: "barcelona" },
    foreignCurrency: null,
    foreignCurrencyAmount: null,
    foreignCurrencyExchangeRate: null,
    typeTransferOrigin: null,
    typeTransferDestination: null,
    taxLines: null,
    transferId: null,
  };

  it("produces a row with the correct number of fields", () => {
    const row = transactionToRow(baseTx, 100);
    const fields = row.split(",");
    expect(fields.length).toBe(CSV_HEADERS.length);
  });

  it("includes the balance value", () => {
    const row = transactionToRow(baseTx, 249.75);
    expect(row).toContain("249.75");
  });

  it("includes the transaction amount", () => {
    const row = transactionToRow(baseTx, 100);
    expect(row).toContain("-50.25");
  });

  it("handles payee with comma by quoting", () => {
    const tx = { ...baseTx, payee: "Store, Inc." };
    const row = transactionToRow(tx, 100);
    expect(row).toContain('"Store, Inc."');
  });

  it("serializes taxLines as JSON", () => {
    const tx = {
      ...baseTx,
      taxLines: [
        {
          id: "tl-1",
          rate: 21,
          amount: 10,
          inclusive: true,
          taxAmount: 2.1,
          accountTransactionId: "tx-1",
        },
      ],
    };
    const row = transactionToRow(tx, 100);
    expect(row).toContain("tl-1");
  });

  it("uses empty string for null taxLines", () => {
    const row = transactionToRow(baseTx, 100);
    // taxLines field should be empty (two consecutive commas around it)
    const fields = row.split(",");
    // taxLines is at index 17 (0-based) in CSV_HEADERS
    const taxIdx = CSV_HEADERS.indexOf("Sales Tax");
    expect(fields[taxIdx]).toBe("");
  });
});
