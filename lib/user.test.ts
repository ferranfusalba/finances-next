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
import { getUserTransactionLocations } from "./user";

const loc = (name: string, placeId: string) => ({
  location: { name, address: "", lat: 0, lng: 0, placeId },
});

describe("getUserTransactionLocations", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns empty array when no locations exist", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);

    const result = await getUserTransactionLocations("user-1");

    expect(result).toEqual([]);
  });

  it("aggregates locations from account transactions", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      loc("Zürich, CH", "zurich"),
      loc("Barcelona, ES", "barcelona"),
    ] as never);

    const result = await getUserTransactionLocations("user-1");

    expect(result).toEqual([
      { name: "Barcelona, ES", address: "", lat: 0, lng: 0, placeId: "barcelona" },
      { name: "Zürich, CH", address: "", lat: 0, lng: 0, placeId: "zurich" },
    ]);
  });

  it("deduplicates locations by placeId", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      loc("Zürich, CH", "zurich"),
      loc("Barcelona, ES", "barcelona"),
      loc("Zürich, CH", "zurich"),
      loc("London, UK", "london"),
    ] as never);

    const result = await getUserTransactionLocations("user-1");

    expect(result.map((l) => l.name)).toEqual([
      "Barcelona, ES",
      "London, UK",
      "Zürich, CH",
    ]);
    expect(result).toHaveLength(3);
  });

  it("returns sorted results", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      loc("Zürich, CH", "zurich"),
      loc("Andorra la Vella, AD", "andorra"),
      loc("Madrid, ES", "madrid"),
    ] as never);

    const result = await getUserTransactionLocations("user-1");

    expect(result.map((l) => l.name)).toEqual([
      "Andorra la Vella, AD",
      "Madrid, ES",
      "Zürich, CH",
    ]);
  });

  it("queries with correct filters", async () => {
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([]);

    await getUserTransactionLocations("user-1");

    expect(db.accountTransaction.findMany).toHaveBeenCalledWith({
      where: { Account: { userId: "user-1" }, location: { not: Prisma.DbNull } },
      select: { location: true },
    });
  });
});
