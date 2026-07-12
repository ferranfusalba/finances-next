import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    account: {
      findMany: vi.fn(),
      create: vi.fn(),
      // Verifies the parent of an INVESTMENT_CASH leg — exists, owned, right type.
      findUnique: vi.fn(),
    },
    accountTransaction: {
      create: vi.fn(),
    },
    // The account and its OPENING transaction are written together. Run the
    // callback against the same mocked client so both writes are observable.
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { GET, POST } from "./route";

const mockUser = { id: "user-1", name: "John", email: "john@example.com" };

describe("GET /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns accounts for the current user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.findMany).mockResolvedValue([
      { id: "acc-1", name: "Checking" },
      { id: "acc-2", name: "Savings" },
    ] as never);

    const response = await GET();
    const json = await response.json();

    expect(json).toHaveLength(2);
    expect(db.account.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });
});

describe("POST /api/accounts", () => {
  const validBody = {
    bankName: "Test Bank",
    name: "Checking",
    code: "CHK",
    type: "CHECKING",
    defaultCurrency: "USD",
    country: "US",
    active: true,
    openingBalance: 1500,
    openingDate: "2024-01-01T12:00:00.000Z",
  };

  function makeRequest(body: Record<string, unknown>) {
    return new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify(body),
    }) as never;
  }

  beforeEach(() => {
    vi.clearAllMocks();
    // Run the interactive transaction against the same mocked client, so the
    // account create and the opening create are both observable.
    vi.mocked(db.$transaction).mockImplementation(
      async (fn: (tx: typeof db) => Promise<unknown>) => fn(db)
    );
    vi.mocked(db.account.create).mockResolvedValue({ id: "acc-1" } as never);
    vi.mocked(db.accountTransaction.create).mockResolvedValue({} as never);
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await POST(makeRequest({ name: "Test" }));

    expect(response.status).toBe(401);
    expect(db.account.create).not.toHaveBeenCalled();
  });

  it("creates a new account with userId from session", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(makeRequest(validBody));
    const json = await response.json();

    expect(json.id).toBe("acc-1");
    expect(db.account.create).toHaveBeenCalledOnce();

    // Verify userId comes from session, not request body
    const createCall = vi.mocked(db.account.create).mock.calls[0][0];
    expect(createCall.data.userId).toBe("user-1");
  });

  it("writes the starting balance as an OPENING transaction", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    await POST(makeRequest(validBody));

    expect(db.accountTransaction.create).toHaveBeenCalledOnce();
    const txCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
    expect(txCall.data.type).toBe("OPENING");
    expect(txCall.data.amount).toBe(1500);
    expect(txCall.data.accountId).toBe("acc-1");
    expect(new Date(txCall.data.dateTime as string).toISOString()).toBe(
      "2024-01-01T12:00:00.000Z"
    );
  });

  it("seeds currentBalance from the opening, not from the request body", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    // currentBalance is derived (SUM of transactions). A client that sends one
    // must not be able to make it disagree with the ledger.
    await POST(makeRequest({ ...validBody, currentBalance: 999999 }));

    const createCall = vi.mocked(db.account.create).mock.calls[0][0];
    expect(createCall.data.currentBalance).toBe(1500);
  });

  it("preserves a negative opening balance — an account may open in the red", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    await POST(makeRequest({ ...validBody, openingBalance: -250.5 }));

    const txCall = vi.mocked(db.accountTransaction.create).mock.calls[0][0];
    expect(txCall.data.amount).toBe(-250.5);
  });

  it("returns 400 when body fails validation", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(makeRequest({ name: "" }));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it("returns 400 when the opening balance is missing", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const { openingBalance: _omitted, ...withoutOpening } = validBody;
    const response = await POST(makeRequest(withoutOpening));

    expect(response.status).toBe(400);
    expect(db.account.create).not.toHaveBeenCalled();
  });

  describe("an investment account is created with both its legs at once", () => {
    const investment = {
      ...validBody,
      type: "INVESTMENT",
      openingBalance: 10_000,
      cashOpeningBalance: 250,
    };

    beforeEach(() => {
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      // Keyed on type rather than call order: a `mockResolvedValueOnce` queue
      // survives `clearAllMocks` and would spill unconsumed values into whatever
      // test runs next.
      vi.mocked(db.account.create).mockImplementation((async (args: {
        data: { type: string };
      }) =>
        args.data.type === "INVESTMENT_CASH"
          ? { id: "cash-1" }
          : { id: "acc-1" }) as never);
    });

    it("creates the cash leg alongside the invested one, in the same write", async () => {
      // A provider that holds cash for you has two balances from the moment it
      // exists. Creating the invested leg first and bolting the cash on after
      // means entering the total as the invested figure, seeing the header sum
      // both legs, and going back to subtract.
      const response = await POST(makeRequest(investment));

      expect(response.status).toBe(200);
      expect(db.account.create).toHaveBeenCalledTimes(2);
      expect(db.accountTransaction.create).toHaveBeenCalledTimes(2);

      const cashCall = vi.mocked(db.account.create).mock.calls[1][0];
      expect(cashCall.data.type).toBe("INVESTMENT_CASH");
      expect(cashCall.data.parentAccountId).toBe("acc-1");
      expect(cashCall.data.currentBalance).toBe(250);
      // Bank, currency and country are inherited — the cash your provider holds
      // is at the same provider, in the same currency, by definition.
      expect(cashCall.data.bankName).toBe(investment.bankName);
      expect(cashCall.data.defaultCurrency).toBe(investment.defaultCurrency);

      // The invested leg keeps its own figure — it is not the total.
      const investedCall = vi.mocked(db.account.create).mock.calls[0][0];
      expect(investedCall.data.currentBalance).toBe(10_000);

      const cashOpening = vi.mocked(db.accountTransaction.create).mock.calls[1][0];
      expect(cashOpening.data.type).toBe("OPENING");
      expect(cashOpening.data.accountId).toBe("cash-1");
      expect(cashOpening.data.amount).toBe(250);
    });

    it("creates no cash leg when the cash balance is omitted", async () => {
      // Blank is not the same as zero: no cash leg at all, versus one holding
      // nothing. You can still add one later.
      const { cashOpeningBalance: _omitted, ...withoutCash } = investment;

      await POST(makeRequest(withoutCash));

      expect(db.account.create).toHaveBeenCalledOnce();
      expect(db.accountTransaction.create).toHaveBeenCalledOnce();
    });

    it("creates a cash leg holding zero when the balance is explicitly 0", async () => {
      await POST(makeRequest({ ...investment, cashOpeningBalance: 0 }));

      expect(db.account.create).toHaveBeenCalledTimes(2);
      const cashCall = vi.mocked(db.account.create).mock.calls[1][0];
      expect(cashCall.data.currentBalance).toBe(0);
    });

    it("rejects a cash balance on an account type that cannot have a cash leg", async () => {
      const response = await POST(
        makeRequest({ ...validBody, type: "CHECKING", cashOpeningBalance: 250 })
      );

      expect(response.status).toBe(400);
      expect(db.account.create).not.toHaveBeenCalled();
    });
  });

  describe("the investment cash leg must hang off an invested parent", () => {
    const cashLeg = {
      ...validBody,
      type: "INVESTMENT_CASH",
      parentAccountId: "parent-1",
    };

    it("creates the cash leg when the parent is a valid INVESTMENT account", async () => {
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique).mockResolvedValue({
        userId: "user-1",
        type: "INVESTMENT",
      } as never);

      const response = await POST(makeRequest(cashLeg));

      expect(response.status).toBe(200);
      const createCall = vi.mocked(db.account.create).mock.calls[0][0];
      expect(createCall.data.parentAccountId).toBe("parent-1");
    });

    it("rejects a cash leg with no parent", async () => {
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);

      const { parentAccountId: _omitted, ...orphan } = cashLeg;
      const response = await POST(makeRequest(orphan));

      expect(response.status).toBe(400);
      expect(db.account.create).not.toHaveBeenCalled();
    });

    it("rejects a parent that belongs to another user", async () => {
      // Otherwise a crafted request could attach a cash leg to someone else's
      // account and surface its transactions on their page.
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique).mockResolvedValue({
        userId: "other-user",
        type: "INVESTMENT",
      } as never);

      const response = await POST(makeRequest(cashLeg));

      expect(response.status).toBe(403);
      expect(db.account.create).not.toHaveBeenCalled();
    });

    it("rejects a parent of the wrong type", async () => {
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);
      vi.mocked(db.account.findUnique).mockResolvedValue({
        userId: "user-1",
        type: "CHECKING",
      } as never);

      const response = await POST(makeRequest(cashLeg));

      expect(response.status).toBe(400);
      expect(db.account.create).not.toHaveBeenCalled();
    });

    it("rejects a parent on an account type that cannot have one", async () => {
      // Only the cash leg nests. A CHECKING account with a parent would render
      // inside someone else's page and vanish from the accounts list.
      vi.mocked(currentUser).mockResolvedValue(mockUser as never);

      const response = await POST(
        makeRequest({ ...validBody, type: "CHECKING", parentAccountId: "parent-1" })
      );

      expect(response.status).toBe(400);
      expect(db.account.create).not.toHaveBeenCalled();
    });
  });

  it("returns 409 when creating account with duplicate code", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.account.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`userId`,`code`)",
        { code: "P2002", clientVersion: "1" }
      )
    );

    const response = await POST(makeRequest(validBody));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("An account with this code already exists");
  });
});
