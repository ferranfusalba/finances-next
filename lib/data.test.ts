import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    accountTransaction: {
      findMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { getSalesTaxTransactions, getTransactionLocations } from "./data";

describe("getSalesTaxTransactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no transactions exist", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);

    const result = await getSalesTaxTransactions("user-1");

    expect(result).toEqual([]);
  });

  it("queries transactions that have tax lines", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);

    await getSalesTaxTransactions("user-1");

    expect(db.accountTransaction.findMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        taxLines: { some: {} },
      },
      orderBy: { dateTime: "asc" },
      select: {
        id: true,
        dateTime: true,
        payee: true,
        concept: true,
        accountId: true,
        amount: true,
        currency: true,
        taxLines: {
          select: {
            rate: true,
            amount: true,
            inclusive: true,
            taxAmount: true,
          },
        },
      },
    });
  });

  it("converts Decimal fields to numbers", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        dateTime: new Date("2025-01-15"),
        payee: "Vendor A",
        concept: "",
        accountId: "acc-1",
        amount: new Prisma.Decimal("100.00"),
        currency: "EUR",
        taxLines: [
          {
            rate: new Prisma.Decimal("21"),
            amount: new Prisma.Decimal("100.00"),
            inclusive: false,
            taxAmount: new Prisma.Decimal("21.00"),
          },
        ],
      },
    ] as never);

    const result = await getSalesTaxTransactions("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].amount).toBe(100);
    expect(result[0].taxLines[0].rate).toBe(21);
    expect(result[0].taxLines[0].amount).toBe(100);
    expect(result[0].taxLines[0].taxAmount).toBe(21);
    expect(result[0].totalTax).toBe(21);
  });

  it("sums totalTax across multiple tax lines", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        dateTime: new Date("2025-03-01"),
        payee: "Multi-tax vendor",
        concept: "",
        accountId: "acc-1",
        amount: new Prisma.Decimal("200.00"),
        currency: "EUR",
        taxLines: [
          {
            rate: new Prisma.Decimal("21"),
            amount: new Prisma.Decimal("100.00"),
            inclusive: false,
            taxAmount: new Prisma.Decimal("21.00"),
          },
          {
            rate: new Prisma.Decimal("10"),
            amount: new Prisma.Decimal("100.00"),
            inclusive: true,
            taxAmount: new Prisma.Decimal("9.09"),
          },
        ],
      },
    ] as never);

    const result = await getSalesTaxTransactions("user-1");

    expect(result[0].totalTax).toBeCloseTo(30.09);
    expect(result[0].taxLines).toHaveLength(2);
  });

  it("handles multiple transactions independently", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        dateTime: new Date("2025-01-01"),
        payee: "Vendor A",
        concept: "",
        accountId: "acc-1",
        amount: new Prisma.Decimal("50.00"),
        currency: "EUR",
        taxLines: [
          {
            rate: new Prisma.Decimal("21"),
            amount: new Prisma.Decimal("50.00"),
            inclusive: false,
            taxAmount: new Prisma.Decimal("10.50"),
          },
        ],
      },
      {
        id: "tx-2",
        dateTime: new Date("2025-02-01"),
        payee: "Vendor B",
        concept: "",
        accountId: "acc-2",
        amount: new Prisma.Decimal("75.00"),
        currency: "EUR",
        taxLines: [
          {
            rate: new Prisma.Decimal("10"),
            amount: new Prisma.Decimal("75.00"),
            inclusive: false,
            taxAmount: new Prisma.Decimal("7.50"),
          },
        ],
      },
    ] as never);

    const result = await getSalesTaxTransactions("user-1");

    expect(result).toHaveLength(2);
    expect(result[0].totalTax).toBe(10.5);
    expect(result[1].totalTax).toBe(7.5);
  });
});

describe("getTransactionLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no transactions exist", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);

    const result = await getTransactionLocations("user-1");

    expect(result).toEqual([]);
  });

  it("queries transactions with non-null location", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);

    await getTransactionLocations("user-1");

    expect(db.accountTransaction.findMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        location: { not: expect.anything() },
      },
      orderBy: { dateTime: "desc" },
      select: {
        id: true,
        dateTime: true,
        payee: true,
        concept: true,
        amount: true,
        currency: true,
        location: true,
      },
    });
  });

  it("groups transactions by placeId", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        dateTime: new Date("2025-01-15"),
        payee: "Shop A",
        concept: "",
        amount: new Prisma.Decimal("50.00"),
        currency: "EUR",
        location: {
          name: "Barcelona, ES",
          address: "Carrer Example 1",
          lat: 41.39,
          lng: 2.17,
          placeId: "bcn-1",
        },
      },
      {
        id: "tx-2",
        dateTime: new Date("2025-02-01"),
        payee: "Shop B",
        concept: "",
        amount: new Prisma.Decimal("30.00"),
        currency: "EUR",
        location: {
          name: "Barcelona, ES",
          address: "Carrer Example 1",
          lat: 41.39,
          lng: 2.17,
          placeId: "bcn-1",
        },
      },
    ] as never);

    const result = await getTransactionLocations("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].location.placeId).toBe("bcn-1");
    expect(result[0].transactions).toHaveLength(2);
    expect(result[0].transactions[0].amount).toBe(50);
    expect(result[0].transactions[1].amount).toBe(30);
  });

  it("separates transactions with different placeIds", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        dateTime: new Date("2025-01-15"),
        payee: "Shop A",
        concept: "",
        amount: new Prisma.Decimal("50.00"),
        currency: "EUR",
        location: {
          name: "Barcelona, ES",
          address: "",
          lat: 41.39,
          lng: 2.17,
          placeId: "bcn-1",
        },
      },
      {
        id: "tx-2",
        dateTime: new Date("2025-02-01"),
        payee: "Shop B",
        concept: "",
        amount: new Prisma.Decimal("75.00"),
        currency: "EUR",
        location: {
          name: "Zürich, CH",
          address: "",
          lat: 47.37,
          lng: 8.54,
          placeId: "zrh-1",
        },
      },
    ] as never);

    const result = await getTransactionLocations("user-1");

    expect(result).toHaveLength(2);
    expect(result[0].location.name).toBe("Barcelona, ES");
    expect(result[1].location.name).toBe("Zürich, CH");
  });

  it("sorts locations alphabetically by name", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        dateTime: new Date("2025-01-01"),
        payee: "Shop",
        concept: "",
        amount: new Prisma.Decimal("10.00"),
        currency: "EUR",
        location: {
          name: "Zürich, CH",
          address: "",
          lat: 47.37,
          lng: 8.54,
          placeId: "zrh-1",
        },
      },
      {
        id: "tx-2",
        dateTime: new Date("2025-01-02"),
        payee: "Shop",
        concept: "",
        amount: new Prisma.Decimal("20.00"),
        currency: "EUR",
        location: {
          name: "Amsterdam, NL",
          address: "",
          lat: 52.37,
          lng: 4.9,
          placeId: "ams-1",
        },
      },
      {
        id: "tx-3",
        dateTime: new Date("2025-01-03"),
        payee: "Shop",
        concept: "",
        amount: new Prisma.Decimal("30.00"),
        currency: "EUR",
        location: {
          name: "Barcelona, ES",
          address: "",
          lat: 41.39,
          lng: 2.17,
          placeId: "bcn-1",
        },
      },
    ] as never);

    const result = await getTransactionLocations("user-1");

    expect(result.map((l) => l.location.name)).toEqual([
      "Amsterdam, NL",
      "Barcelona, ES",
      "Zürich, CH",
    ]);
  });

  it("skips transactions with null or missing placeId", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      {
        id: "tx-1",
        dateTime: new Date("2025-01-01"),
        payee: "Shop",
        concept: "",
        amount: new Prisma.Decimal("10.00"),
        currency: "EUR",
        location: null,
      },
      {
        id: "tx-2",
        dateTime: new Date("2025-01-02"),
        payee: "Shop",
        concept: "",
        amount: new Prisma.Decimal("20.00"),
        currency: "EUR",
        location: {
          name: "Barcelona, ES",
          address: "",
          lat: 41.39,
          lng: 2.17,
          placeId: "bcn-1",
        },
      },
    ] as never);

    const result = await getTransactionLocations("user-1");

    expect(result).toHaveLength(1);
    expect(result[0].location.placeId).toBe("bcn-1");
  });
});
