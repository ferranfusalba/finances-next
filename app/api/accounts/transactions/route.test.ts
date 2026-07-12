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
      // Backs the opening-date invariant and the one-opening-per-account check.
      // Defaults to null: no opening, no earlier transaction, nothing to violate.
      findFirst: vi.fn(),
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
  timezoneId: "Etc/UTC",
  notes: "",
};

describe("POST /api/accounts/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // No opening and no earlier transaction unless a test says otherwise, so the
    // opening-date invariant is satisfied by default.
    vi.mocked(db.accountTransaction.findFirst).mockResolvedValue(null as never);
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
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
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
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
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
      .mockResolvedValueOnce({ userId: "user-1", type: "CHECKING" } as never)
      .mockResolvedValueOnce({ userId: "user-1", type: "CHECKING" } as never);

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
    // The request sends an UNSIGNED 100. The server applies the sign, so money
    // leaves the origin and arrives at the destination. Previously the amount
    // was written verbatim, so an unsigned API call inflated the origin balance.
    expect(originCall.data.amount).toBe(-100);
    expect(mirrorCall.data.amount).toBe(100);
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
      .mockResolvedValueOnce({ userId: "user-1", type: "CHECKING" } as never)
      .mockResolvedValueOnce({ userId: "other-user", type: "CHECKING" } as never);

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
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
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
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
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
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
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

  it("passes recurring frequency to the database", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
    vi.mocked(db.accountTransaction.create).mockResolvedValue({
      id: "txn-1",
      ...baseTransaction,
      recurring: "MONTHLY",
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -50 },
    } as never);
    vi.mocked(db.account.update).mockResolvedValue({} as never);

    await POST(makeRequest({ ...baseTransaction, recurring: "MONTHLY" }));

    const createCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
    expect(createCall.data.recurring).toBe("MONTHLY");
  });

  it("omits recurring when not provided", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
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
    expect(createCall.data.recurring).toBeUndefined();
  });

  it("returns 500 when create fails", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findUnique).mockResolvedValue({ userId: "user-1", type: "CHECKING" } as never);
    vi.mocked(db.accountTransaction.create).mockRejectedValue(
      new Error("DB write failed")
    );

    const response = await POST(makeRequest({ ...baseTransaction }));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB write failed");
  });

  describe("server-side sign enforcement", () => {
    function mockOk(accountType = "CHECKING") {
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique).mockResolvedValue({
        userId: "user-1",
        type: accountType,
      } as never);
      vi.mocked(db.accountTransaction.create).mockResolvedValue({} as never);
      vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
        _sum: { amount: 0 },
      } as never);
      vi.mocked(db.account.update).mockResolvedValue({} as never);
    }

    it("forces an EXPENSE negative even when the request sends it positive", async () => {
      mockOk();

      // The client signs amounts, but nothing stopped a direct API call from
      // sending +100 for an EXPENSE, which used to be written verbatim and
      // inflate the balance.
      await POST(makeRequest({ ...baseTransaction, type: "EXPENSE", amount: 100 }));

      const createCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
      expect(createCall.data.amount).toBe(-100);
    });

    it("preserves a NEGATIVE return — the sign must survive", async () => {
      mockOk("INVESTMENT");

      // March 2026 on Indexa Fondos was -1.099,94. The old Math.abs fallthrough
      // would have stored +1.099,94, putting the balance ~€2.200 out.
      await POST(
        makeRequest({
          ...baseTransaction,
          type: "RETURN",
          amount: -1099.94,
          payee: "",
          category: "",
        })
      );

      const createCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
      expect(createCall.data.amount).toBe(-1099.94);
    });

    it("forces a WITHHOLDING negative", async () => {
      // Retenciones are posted to the cash leg, which is where the provider
      // actually takes them from.
      mockOk("INVESTMENT_CASH");

      await POST(makeRequest({ ...baseTransaction, type: "WITHHOLDING", amount: 0.03 }));

      const createCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
      expect(createCall.data.amount).toBe(-0.03);
    });

    it("rejects RETURN on a non-investment account", async () => {
      mockOk("CHECKING");

      const response = await POST(
        makeRequest({ ...baseTransaction, type: "RETURN", amount: 100 })
      );

      expect(response.status).toBe(400);
      expect(db.accountTransaction.create).not.toHaveBeenCalled();
    });

    it("rejects an unknown transaction type instead of treating it as INCOME", async () => {
      mockOk();

      // `type: "BANANA"` used to persist and fall through to Math.abs().
      const response = await POST(
        makeRequest({ ...baseTransaction, type: "BANANA", amount: 100 })
      );

      expect(response.status).toBe(400);
      expect(db.accountTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe("account type gates transaction type", () => {
    function mockAccount(accountType: string) {
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique).mockResolvedValue({
        userId: "user-1",
        type: accountType,
      } as never);
      vi.mocked(db.accountTransaction.create).mockResolvedValue({} as never);
      vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
        _sum: { amount: 0 },
      } as never);
      vi.mocked(db.account.update).mockResolvedValue({} as never);
    }

    it.each([
      ["CHECKING", "RETURN"],
      ["SAVINGS", "RETURN"],
      ["CASH", "WITHHOLDING"],
      ["PREPAID", "ROUNDING"],
    ])("rejects %s on a %s account", async (accountType, type) => {
      mockAccount(accountType);

      const response = await POST(
        makeRequest({ ...baseTransaction, type, amount: 100, category: "" })
      );

      expect(response.status).toBe(400);
      expect(db.accountTransaction.create).not.toHaveBeenCalled();
    });

    it.each(["INCOME", "EXPENSE", "TRANSFER"])(
      "accepts %s on a CHECKING account",
      async (type) => {
        mockAccount("CHECKING");

        // TRANSFER without a destination stays a single row — no mirror to mock.
        const response = await POST(
          makeRequest({ ...baseTransaction, type, amount: 100 })
        );

        expect(response.status).toBe(200);
        expect(db.accountTransaction.create).toHaveBeenCalled();
      }
    );
  });

  describe("the opening-date invariant", () => {
    function mockAccountWithOpening(openingAt: Date) {
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique).mockResolvedValue({
        userId: "user-1",
        type: "CHECKING",
      } as never);
      vi.mocked(db.accountTransaction.findFirst).mockResolvedValue({
        dateTime: openingAt,
      } as never);
      vi.mocked(db.accountTransaction.create).mockResolvedValue({} as never);
      vi.mocked(db.accountTransaction.aggregate).mockResolvedValue({
        _sum: { amount: 0 },
      } as never);
      vi.mocked(db.account.update).mockResolvedValue({} as never);
    }

    it("rejects a transaction dated before the account's opening", async () => {
      mockAccountWithOpening(new Date("2024-01-01T00:00:00Z"));

      const response = await POST(
        makeRequest({
          ...baseTransaction,
          type: "EXPENSE",
          amount: 50,
          dateTime: "2023-06-01T00:00:00.000Z",
        })
      );

      expect(response.status).toBe(400);
      expect(db.accountTransaction.create).not.toHaveBeenCalled();
    });

    it("rejects a second opening on an account that already has one", async () => {
      // The dropdown never offers OPENING and copy is disabled on the row, but a
      // direct POST would double-count the starting balance.
      mockAccountWithOpening(new Date("2024-01-01T00:00:00Z"));

      const response = await POST(
        makeRequest({
          ...baseTransaction,
          type: "OPENING",
          amount: 500,
          category: "",
          dateTime: "2020-01-01T00:00:00.000Z",
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toMatch(/already has an opening balance/);
      expect(db.accountTransaction.create).not.toHaveBeenCalled();
    });

    it("rejects a transfer whose mirror would land before the destination's opening", async () => {
      // The mirror row is written straight into the destination. Nothing else
      // checks it — there is no form for it.
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique)
        .mockResolvedValueOnce({ userId: "user-1", type: "CHECKING" } as never)
        .mockResolvedValueOnce({ userId: "user-1", type: "SAVINGS" } as never);
      // The destination's opening postdates the transfer.
      vi.mocked(db.accountTransaction.findFirst).mockResolvedValue({
        dateTime: new Date("2025-01-01T00:00:00Z"),
      } as never);

      const response = await POST(
        makeRequest({
          ...baseTransaction,
          type: "TRANSFER",
          amount: 100,
          typeTransferDestination: "acc-2",
          dateTime: "2024-06-01T00:00:00.000Z",
        })
      );

      expect(response.status).toBe(400);
      const json = await response.json();
      expect(json.error).toMatch(/Destination account/);
      expect(db.accountTransaction.create).not.toHaveBeenCalled();
    });
  });

  describe("the transfer mirror row is validated against the destination", () => {
    it("rejects a transfer into an account that cannot hold one", async () => {
      // The mirror row is written straight into the destination without ever
      // passing through a form, so this guard is the only thing standing between
      // a hostile payload and an illegal row on another account.
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique)
        .mockResolvedValueOnce({ userId: "user-1", type: "CHECKING" } as never)
        .mockResolvedValueOnce({ userId: "user-1", type: "BANANA" } as never);

      const response = await POST(
        makeRequest({
          ...baseTransaction,
          type: "TRANSFER",
          amount: 100,
          typeTransferDestination: "acc-2",
        })
      );

      expect(response.status).toBe(400);
      expect(db.accountTransaction.create).not.toHaveBeenCalled();
    });
  });
});
