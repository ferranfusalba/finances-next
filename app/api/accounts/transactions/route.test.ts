import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    accountTransaction: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
    account: {
      update: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { POST } from "./route";

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/accounts/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

const baseTransaction = {
  id: "txn-1",
  payee: "Store",
  concept: "Groceries",
  type: "EXPENSE",
  currency: "USD",
  amount: -50,
  accountId: "acc-1",
  dateTime: "2024-01-15T10:00:00Z",
  timezone: "UTC",
};

describe("POST /api/accounts/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a transaction and recomputes balance", async () => {
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      ...baseTransaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -50 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    const response = await POST(makeRequest(baseTransaction));
    const json = await response.json();

    expect(json.id).toBe("txn-1");
    expect(db.accountTransaction.create).toHaveBeenCalledOnce();
    expect(db.accountTransaction.aggregate).toHaveBeenCalledWith({
      where: { accountId: "acc-1" },
      _sum: { amount: true },
    });
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { currentBalance: -50 },
    });
  });

  it("sets currentBalance to 0 when aggregate sum is null", async () => {
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      ...baseTransaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: null },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await POST(makeRequest(baseTransaction));

    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { currentBalance: 0 },
    });
  });

  it("creates mirror transaction for transfers", async () => {
    const transferData = {
      ...baseTransaction,
      type: "TRANSFER",
      amount: 100,
      typeTransferDestination: "acc-2",
    };

    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      ...transferData,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: 100 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await POST(makeRequest(transferData));

    // Should create 2 transactions
    expect(db.accountTransaction.create).toHaveBeenCalledTimes(2);

    // Second call is the mirror: negated amount, destination accountId
    const mirrorCall = vi.mocked(db.accountTransaction.create).mock.calls[1][0];
    expect(mirrorCall.data.amount).toBe(-100);
    expect(mirrorCall.data.accountId).toBe("acc-2");

    // Should recompute both accounts' balances
    expect(db.accountTransaction.aggregate).toHaveBeenCalledTimes(2);
    expect(db.account.update).toHaveBeenCalledTimes(2);
  });

  it("does not create mirror transaction for non-transfer types", async () => {
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      ...baseTransaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -50 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await POST(makeRequest(baseTransaction));

    expect(db.accountTransaction.create).toHaveBeenCalledOnce();
    expect(db.accountTransaction.aggregate).toHaveBeenCalledOnce();
    expect(db.account.update).toHaveBeenCalledOnce();
  });

  it("returns 500 when create fails", async () => {
    vi.mocked(db.accountTransaction.create).mockRejectedValue(
      new Error("DB write failed")
    );

    const response = await POST(makeRequest(baseTransaction));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB write failed");
  });
});
