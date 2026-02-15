import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    budget: {
      findUnique: vi.fn(),
      update: vi.fn(),
    },
    budgetTransaction: {
      create: vi.fn(),
      aggregate: vi.fn(),
      update: vi.fn(),
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

const baseTransaction = {
  concept: "Office supplies",
  type: "EXPENSE",
  currency: "USD",
  amount: -30,
  budgetId: "bgt-1",
  dateTime: "2024-01-15T10:00:00Z",
  timezone: "UTC",
  notes: "",
};

describe("POST /api/budgets/transactions", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const request = new Request(
      "http://localhost/api/budgets/transactions",
      {
        method: "POST",
        body: JSON.stringify(baseTransaction),
      }
    );

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    expect(db.budgetTransaction.create).not.toHaveBeenCalled();
  });

  it("returns 403 when user does not own the budget", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.budget.findUnique).mockResolvedValueOnce({ userId: "other-user" } as never);

    const request = new Request(
      "http://localhost/api/budgets/transactions",
      {
        method: "POST",
        body: JSON.stringify(baseTransaction),
      }
    );

    const response = await POST(request as never);

    expect(response.status).toBe(403);
    expect(db.budgetTransaction.create).not.toHaveBeenCalled();
  });

  it("returns 400 when body fails validation", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const request = new Request(
      "http://localhost/api/budgets/transactions",
      {
        method: "POST",
        body: JSON.stringify({ amount: "not-a-number" }),
      }
    );

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(db.budgetTransaction.create).not.toHaveBeenCalled();
  });

  it("creates a budget transaction and recomputes balance server-side", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    // First findUnique call is for ownership check, second is inside recomputeBalance
    vi.mocked(db.budget.findUnique)
      .mockResolvedValueOnce({ userId: "user-1" } as never)
      .mockResolvedValueOnce({ initialBalance: 1000 } as never);
    vi.mocked(db.budgetTransaction.create).mockResolvedValue({
      ...baseTransaction,
      id: "btxn-1",
      balance: 0,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as never);
    vi.mocked(db.budgetTransaction.aggregate).mockResolvedValue({
      _sum: { amount: -30 },
    } as never);
    vi.mocked(db.budget.update).mockResolvedValue({} as never);
    vi.mocked(db.budgetTransaction.update).mockResolvedValue({} as never);

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
    expect(db.budgetTransaction.create).toHaveBeenCalledOnce();
    expect(db.budgetTransaction.aggregate).toHaveBeenCalledWith({
      where: { budgetId: "bgt-1" },
      _sum: { amount: true },
    });
    expect(db.budget.update).toHaveBeenCalledWith({
      where: { id: "bgt-1" },
      data: { currentBalance: 970 },
    });
    expect(db.budgetTransaction.update).toHaveBeenCalledWith({
      where: { id: "btxn-1" },
      data: { balance: 970 },
    });
  });

  it("returns 500 when create fails", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.budget.findUnique).mockResolvedValueOnce({ userId: "user-1" } as never);
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
