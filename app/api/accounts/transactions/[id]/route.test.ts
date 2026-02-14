import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    accountTransaction: {
      findUnique: vi.fn(),
      delete: vi.fn(),
      aggregate: vi.fn(),
    },
    account: {
      update: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { DELETE } from "./route";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("DELETE /api/accounts/transactions/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 404 when transaction not found", async () => {
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue(null as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-999"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json).toBe("Transaction not found");
    expect(db.accountTransaction.delete).not.toHaveBeenCalled();
  });

  it("deletes transaction and recomputes account balance", async () => {
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
    } as never);
    vi.mocked(db.accountTransaction.delete).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: 250 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));
    const json = await response.json();

    expect(json).toEqual({ deleted: "txn-1" });
    expect(db.accountTransaction.findUnique).toHaveBeenCalledWith({
      where: { id: "txn-1" },
      select: { accountId: true, amount: true },
    });
    expect(db.accountTransaction.delete).toHaveBeenCalledWith({
      where: { id: "txn-1" },
    });
    expect(db.accountTransaction.aggregate).toHaveBeenCalledWith({
      where: { accountId: "acc-1" },
      _sum: { amount: true },
    });
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: { currentBalance: 250 },
    });
  });

  it("sets balance to 0 when no transactions remain", async () => {
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
    } as never);
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

  it("returns { deleted: id } on success", async () => {
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 50,
    } as never);
    vi.mocked(db.accountTransaction.delete).mockResolvedValue({} as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: 150 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-42"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual({ deleted: "txn-42" });
  });

  it("returns 500 on error", async () => {
    vi.mocked(db.accountTransaction.findUnique).mockResolvedValue({
      accountId: "acc-1",
      amount: 100,
    } as never);
    vi.mocked(db.accountTransaction.delete).mockRejectedValue(
      new Error("Delete failed")
    );

    const response = await DELETE(new Request("http://localhost") as never, makeParams("txn-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toBe("Delete failed");
  });
});
