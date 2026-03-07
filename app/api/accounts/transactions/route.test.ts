import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    accountTransaction: {
      create: vi.fn(),
      aggregate: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { POST } from "./route";

const mockUser = { id: "user-1", name: "John", email: "john@example.com" };

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/accounts/transactions", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

const baseTransaction = {
  payee: "Store",
  concept: "Groceries",
  type: "EXPENSE",
  currency: "USD",
  amount: -50,
  accountId: "acc-1",
  dateTime: "2024-01-15T10:00:00Z",
  timezone: "UTC",
  notes: "",
};

describe("POST /api/accounts/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await POST(makeRequest(baseTransaction));

    expect(response.status).toBe(401);
    expect(db.accountTransaction.create).not.toHaveBeenCalled();
  });

  it("returns 403 when user does not own the account", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "other-user" } as never);

    const response = await POST(makeRequest(baseTransaction));

    expect(response.status).toBe(403);
    expect(db.accountTransaction.create).not.toHaveBeenCalled();
  });

  it("returns 400 when body fails validation", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(makeRequest({ amount: "not-a-number" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(db.accountTransaction.create).not.toHaveBeenCalled();
  });

  it("creates a transaction and recomputes balance", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      id: "txn-1",
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
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      id: "txn-1",
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
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    // Both accounts belong to user
    vi.mocked(db.account.findUnique)
      .mockResolvedValueOnce({ userId: "user-1" } as never)
      .mockResolvedValueOnce({ userId: "user-1" } as never);

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

    // Second call is the mirror: negated amount, destination accountId, shared transferId
    const originCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
    const mirrorCall = vi.mocked(db.accountTransaction.create).mock.calls[1][0];
    expect(mirrorCall.data.amount).toBe(-100);
    expect(mirrorCall.data.accountId).toBe("acc-2");
    expect(originCall.data.transferId).toBeDefined();
    expect(mirrorCall.data.transferId).toBe(originCall.data.transferId);

    // Should recompute both accounts' balances
    expect(db.accountTransaction.aggregate).toHaveBeenCalledTimes(2);
    expect(db.account.update).toHaveBeenCalledTimes(2);
  });

  it("returns 403 when transfer destination belongs to another user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique)
      .mockResolvedValueOnce({ userId: "user-1" } as never)
      .mockResolvedValueOnce({ userId: "other-user" } as never);

    const transferData = {
      ...baseTransaction,
      type: "TRANSFER",
      amount: 100,
      typeTransferDestination: "acc-2",
    };

    const response = await POST(makeRequest(transferData));

    expect(response.status).toBe(403);
    expect(db.accountTransaction.create).not.toHaveBeenCalled();
  });

  it("does not create mirror transaction for non-transfer types", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      id: "txn-1",
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
    const call = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
    expect(call.data.transferId).toBeUndefined();
    expect(db.accountTransaction.aggregate).toHaveBeenCalledOnce();
    expect(db.account.update).toHaveBeenCalledOnce();
  });

  it("passes taxLines as nested create to the database", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    const taxLines = [
      { rate: 21, amount: 50, inclusive: true, taxAmount: 8.68 },
      { rate: 10, amount: 30, inclusive: false, taxAmount: 3 },
    ];

    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      id: "txn-1",
      ...baseTransaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -50 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await POST(makeRequest({ ...baseTransaction, taxLines }));

    const createCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
    expect(createCall.data.taxLines).toEqual({
      create: taxLines.map(line => ({
        rate: line.rate,
        amount: line.amount,
        inclusive: line.inclusive,
        taxAmount: line.taxAmount,
      })),
    });
  });

  it("does not include taxLines when none provided", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      id: "txn-1",
      ...baseTransaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -50 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await POST(makeRequest(baseTransaction));

    const createCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
    expect(createCall.data.taxLines).toBeUndefined();
  });

  it("returns 500 when create fails", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.create).mockRejectedValue(
      new Error("DB write failed")
    );

    const response = await POST(makeRequest({ ...baseTransaction }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB write failed");
  });
});
