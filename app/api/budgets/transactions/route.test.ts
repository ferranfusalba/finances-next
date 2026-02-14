import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    budgetTransaction: {
      create: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { POST } from "./route";

const baseTransaction = {
  id: "btxn-1",
  concept: "Office supplies",
  type: "EXPENSE",
  currency: "USD",
  amount: -30,
  balance: 970,
  budgetId: "bgt-1",
  dateTime: "2024-01-15T10:00:00Z",
  timezone: "UTC",
};

describe("POST /api/budgets/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a budget transaction", async () => {
    vi.mocked(db.budgetTransaction.create).mockResolvedValue({
      ...baseTransaction,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);

    const request = new Request(
      "http://localhost/api/budgets/transactions",
      {
        method: "POST",
        body: JSON.stringify(baseTransaction),
      }
    );

    const response = await POST(request as never);
    const json = await response.json();

    expect(json.id).toBe("btxn-1");
    expect(json.amount).toBe(-30);
    expect(db.budgetTransaction.create).toHaveBeenCalledOnce();

    const createArg = vi.mocked(db.budgetTransaction.create).mock.calls[0][0];
    expect(createArg.data.budgetId).toBe("bgt-1");
    expect(createArg.data.balance).toBe(970);
  });

  it("returns 500 when create fails", async () => {
    vi.mocked(db.budgetTransaction.create).mockRejectedValue(
      new Error("DB write failed")
    );

    const request = new Request(
      "http://localhost/api/budgets/transactions",
      {
        method: "POST",
        body: JSON.stringify(baseTransaction),
      }
    );

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("DB write failed");
  });
});
