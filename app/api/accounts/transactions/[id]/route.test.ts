import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    accountTransaction: {
      findUnique: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    taxLine: {
      deleteMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { PUT, DELETE } from "./route";

const mockUser = { id: "user-1", name: "John", email: "john@example.com" };
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

function makePutRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/accounts/transactions/txn-1", {
    method: "PUT",
    body: JSON.stringify(body),
  }) as never;
}

const baseUpdate = {
  payee: "Updated Store",
  concept: "Updated Groceries",
  type: "EXPENSE",
  currency: "USD",
  amount: -75,
  accountId: "acc-1",
  dateTime: "2024-01-15T12:00:00Z",
  timezone: "1",
  notes: "updated",
};

describe("PUT /api/accounts/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await PUT(makePutRequest(baseUpdate), makeParams("txn-1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when transaction not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue(null as never);

    const response = await PUT(makePutRequest(baseUpdate), makeParams("txn-999"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Transaction not found");
    expect(db.accountTransaction.update).not.toHaveBeenCalled();
  });

  it("returns 403 when transaction account belongs to another user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "other-user" } as never);

    const response = await PUT(makePutRequest(baseUpdate), makeParams("txn-1"));

    expect(response.status).toBe(403);
    expect(db.accountTransaction.update).not.toHaveBeenCalled();
  });

  it("updates transaction, deletes old tax lines, and recomputes balance", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.taxLine.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.accountTransaction.update).mockResolvedValue({
      id: "txn-1",
      ...baseUpdate,
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -75 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    const response = await PUT(makePutRequest(baseUpdate), makeParams("txn-1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.id).toBe("txn-1");

    // Should delete existing tax lines first
    expect(db.taxLine.deleteMany).toHaveBeenCalledWith({
      where: { accountTransactionId: "txn-1" },
    });

    // Should update the transaction
    expect(db.accountTransaction.update).toHaveBeenCalledWith({
      where: { id: "txn-1" },
      data: expect.objectContaining({
        payee: "Updated Store",
        amount: -75,
      }),
    });

    // Should recompute balance
    expect(db.accountTransaction.aggregate).toHaveBeenCalledWith({
      where: { accountId: "acc-1" },
      _sum: { amount: true },
    });
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { currentBalance: -75 },
    });
  });

  it("creates new tax lines when provided", async () => {
    const taxLines = [
      { rate: 21, amount: 75, inclusive: true, taxAmount: 13.02 },
    ];

    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.taxLine.deleteMany).mockResolvedValue({ count: 1 } as never);
    vi.mocked(db.accountTransaction.update).mockResolvedValue({
      id: "txn-1",
      ...baseUpdate,
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -75 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await PUT(makePutRequest({ ...baseUpdate, taxLines }), makeParams("txn-1"));

    const updateCall = vi.mocked(db.accountTransaction.update).mock.calls[0][0];
    expect(updateCall.data.taxLines).toEqual({
      create: [{ rate: 21, amount: 75, inclusive: true, taxAmount: 13.02 }],
    });
  });

  it("does not include taxLines in update when none provided", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.taxLine.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.accountTransaction.update).mockResolvedValue({
      id: "txn-1",
      ...baseUpdate,
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -75 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await PUT(makePutRequest(baseUpdate), makeParams("txn-1"));

    const updateCall = vi.mocked(db.accountTransaction.update).mock.calls[0][0];
    expect(updateCall.data.taxLines).toBeUndefined();
  });

  it("returns 500 on error", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.taxLine.deleteMany).mockRejectedValue(
      new Error("DB error"),
    );

    const response = await PUT(makePutRequest(baseUpdate), makeParams("txn-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB error");
  });

  it("backfills transferId for existing transfers without one and syncs mirror", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      type: "TRANSFER",
      transferId: null,
      typeTransferOrigin: "acc-1",
      typeTransferDestination: "acc-2",
      dateTime: new Date("2024-01-15T12:00:00Z"),
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.taxLine.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.accountTransaction.update).mockResolvedValue({
      id: "txn-1",
      ...baseUpdate,
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -75 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.findFirst).mockResolvedValue({
      id: "mirror-txn",
    } as never);

    await PUT(makePutRequest(baseUpdate), makeParams("txn-1"));

    const updateCalls = vi.mocked(db.accountTransaction.update).mock.calls;
    // 1: normal update, 2: backfill transferId on origin, 3: backfill transferId on mirror, 4: sync mirror fields
    expect(updateCalls).toHaveLength(4);

    // Second call: backfill transferId on edited transaction
    expect(updateCalls[1][0].where).toEqual({ id: "txn-1" });
    const backfilledId = updateCalls[1][0].data.transferId;
    expect(backfilledId).toBeDefined();

    // Third call: same transferId on mirror transaction
    expect(updateCalls[2][0].where).toEqual({ id: "mirror-txn" });
    expect(updateCalls[2][0].data.transferId).toBe(backfilledId);

    // Fourth call: sync mirror fields with inverted amount
    expect(updateCalls[3][0].where).toEqual({ id: "mirror-txn" });
    expect(updateCalls[3][0].data.amount).toBe(75);

    // Mirror lookup for backfill used dateTime-based filter
    expect(db.accountTransaction.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: "acc-2",
        type: "TRANSFER",
        dateTime: new Date("2024-01-15T12:00:00Z"),
        transferId: null,
      },
    });

    // Mirror lookup for sync used transferId-based filter
    expect(db.accountTransaction.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: "acc-2",
        type: "TRANSFER",
        transferId: backfilledId,
      },
    });

    // Destination account balance recomputed
    expect(db.accountTransaction.aggregate).toHaveBeenCalledWith({
      where: { accountId: "acc-2" },
      _sum: { amount: true },
    });
  });

  it("syncs mirror transaction when transfer already has transferId", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      type: "TRANSFER",
      transferId: "existing-tid",
      typeTransferOrigin: "acc-1",
      typeTransferDestination: "acc-2",
      dateTime: new Date("2024-01-15T12:00:00Z"),
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.taxLine.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.accountTransaction.update).mockResolvedValue({
      id: "txn-1",
      ...baseUpdate,
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -75 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.findFirst).mockResolvedValue({
      id: "mirror-txn",
    } as never);

    await PUT(makePutRequest(baseUpdate), makeParams("txn-1"));

    // 1: normal update, 2: sync mirror fields (no backfill needed)
    const updateCalls = vi.mocked(db.accountTransaction.update).mock.calls;
    expect(updateCalls).toHaveLength(2);

    // Second call: sync mirror with inverted amount
    expect(updateCalls[1][0].where).toEqual({ id: "mirror-txn" });
    expect(updateCalls[1][0].data.amount).toBe(75);
    expect(updateCalls[1][0].data.concept).toBe("Updated Groceries");

    // Used transferId to find mirror
    expect(db.accountTransaction.findFirst).toHaveBeenCalledWith({
      where: {
        accountId: "acc-2",
        type: "TRANSFER",
        transferId: "existing-tid",
      },
    });
  });
});

describe("DELETE /api/accounts/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when transaction not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue(null as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-999"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toBe("Transaction not found");
    expect(db.accountTransaction.delete).not.toHaveBeenCalled();
  });

  it("returns 403 when transaction account belongs to another user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "other-user" } as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));

    expect(response.status).toBe(403);
    expect(db.accountTransaction.delete).not.toHaveBeenCalled();
  });

  it("deletes transaction and recomputes account balance", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.delete).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: 250 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));
    const json = await response.json();

    expect(json).toEqual({ deleted: "txn-1" });
    expect(db.accountTransaction.delete).toHaveBeenCalledWith({
      where: { id: "txn-1" },
    });
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { currentBalance: 250 },
    });
  });

  it("sets balance to 0 when no transactions remain", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.delete).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: null },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));

    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { currentBalance: 0 },
    });
  });

  it("deletes mirror transaction for transfers", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: -100,
      type: "TRANSFER",
      transferId: "tid-1",
      typeTransferOrigin: "acc-1",
      typeTransferDestination: "acc-2",
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.delete).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: 0 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.findFirst).mockResolvedValue({
      id: "mirror-txn",
    } as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));
    const json = await response.json();

    expect(json).toEqual({ deleted: "txn-1" });

    // Both origin and mirror deleted
    const deleteCalls = vi.mocked(db.accountTransaction.delete).mock.calls;
    expect(deleteCalls).toHaveLength(2);
    expect(deleteCalls[0][0].where).toEqual({ id: "txn-1" });
    expect(deleteCalls[1][0].where).toEqual({ id: "mirror-txn" });

    // Both account balances recomputed
    expect(db.accountTransaction.aggregate).toHaveBeenCalledWith({
      where: { accountId: "acc-1" },
      _sum: { amount: true },
    });
    expect(db.accountTransaction.aggregate).toHaveBeenCalledWith({
      where: { accountId: "acc-2" },
      _sum: { amount: true },
    });
  });

  it("skips mirror deletion for non-transfer transactions", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
      type: "EXPENSE",
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.delete).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: 250 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));

    expect(db.accountTransaction.delete).toHaveBeenCalledOnce();
    expect(db.accountTransaction.findFirst).not.toHaveBeenCalled();
  });

  it("returns 500 on error", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
    } as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1" } as never);
    vi.mocked(db.accountTransaction.delete).mockRejectedValue(
      new Error("Delete failed")
    );

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toBe("Delete failed");
  });
});
