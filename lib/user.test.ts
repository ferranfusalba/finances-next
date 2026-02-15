import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    accountTransaction: {
      findMany: vi.fn(),
    },
    budgetTransaction: {
      findMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { getUserTransactionLocations } from "./user";

describe("getUserTransactionLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no locations exist", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);
    vi.mocked(db.budgetTransaction.findMany).mockResolvedValue([]);

    const result = await getUserTransactionLocations("user-1");

    expect(result).toEqual([]);
  });

  it("aggregates locations from account transactions", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      { location: "Zürich, CH" },
      { location: "Barcelona, ES" },
    ] as never);
    vi.mocked(db.budgetTransaction.findMany).mockResolvedValue([]);

    const result = await getUserTransactionLocations("user-1");

    expect(result).toEqual(["Barcelona, ES", "Zürich, CH"]);
  });

  it("aggregates locations from budget transactions", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);
    vi.mocked(db.budgetTransaction.findMany).mockResolvedValue([
      { location: "Madrid, ES" },
    ] as never);

    const result = await getUserTransactionLocations("user-1");

    expect(result).toEqual(["Madrid, ES"]);
  });

  it("deduplicates locations across both transaction types", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      { location: "Zürich, CH" },
      { location: "Barcelona, ES" },
    ] as never);
    vi.mocked(db.budgetTransaction.findMany).mockResolvedValue([
      { location: "Zürich, CH" },
      { location: "London, UK" },
    ] as never);

    const result = await getUserTransactionLocations("user-1");

    expect(result).toEqual(["Barcelona, ES", "London, UK", "Zürich, CH"]);
  });

  it("returns sorted results", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      { location: "Zürich, CH" },
      { location: "Andorra la Vella, AD" },
    ] as never);
    vi.mocked(db.budgetTransaction.findMany).mockResolvedValue([
      { location: "Madrid, ES" },
    ] as never);

    const result = await getUserTransactionLocations("user-1");

    expect(result).toEqual([
      "Andorra la Vella, AD",
      "Madrid, ES",
      "Zürich, CH",
    ]);
  });

  it("queries with correct filters", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);
    vi.mocked(db.budgetTransaction.findMany).mockResolvedValue([]);

    await getUserTransactionLocations("user-1");

    expect(db.accountTransaction.findMany).toHaveBeenCalledWith({
      where: { Account: { userId: "user-1" }, location: { not: "" } },
      select: { location: true },
      distinct: ["location"],
    });
    expect(db.budgetTransaction.findMany).toHaveBeenCalledWith({
      where: { Budget: { userId: "user-1" }, location: { not: "" } },
      select: { location: true },
      distinct: ["location"],
    });
  });
});
