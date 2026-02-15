import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    budget: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    budgetTransaction: {
      deleteMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { GET, PUT, DELETE } from "./route";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/budgets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the budget by ID", async () => {
    const budget = { id: "bgt-1", name: "Marketing", code: "MKT", initialBalance: 1000, currentBalance: 500 };
    vi.mocked(db.budget.findUnique).mockResolvedValue(budget as never);

    const response = await GET(new Request("http://localhost") as never, makeParams("bgt-1"));
    const json = await response.json();

    expect(json).toEqual(budget);
    expect(db.budget.findUnique).toHaveBeenCalledWith({ where: { id: "bgt-1" } });
  });

  it("returns 404 when budget not found", async () => {
    vi.mocked(db.budget.findUnique).mockResolvedValue(null as never);

    const response = await GET(new Request("http://localhost") as never, makeParams("nonexistent"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Budget not found");
  });
});

describe("PUT /api/budgets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the budget with provided data", async () => {
    vi.mocked(db.budget.update).mockResolvedValue({} as never);
    const updateData = { name: "Updated Budget" };

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    const response = await PUT(request as never, makeParams("bgt-1"));
    const json = await response.json();

    expect(json).toBe("Updating Budget bgt-1");
    expect(db.budget.update).toHaveBeenCalledWith({
      where: { id: "bgt-1" },
      data: updateData,
    });
  });

  it("returns 400 when body fails validation", async () => {
    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ name: "", code: "" }),
    });

    const response = await PUT(request as never, makeParams("bgt-1"));
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(db.budget.update).not.toHaveBeenCalled();
  });

  it("returns 409 when update causes duplicate code", async () => {
    vi.mocked(db.budget.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`userId`,`code`)",
        { code: "P2002", clientVersion: "1" }
      )
    );

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ code: "DUPLICATE" }),
    });

    const response = await PUT(request as never, makeParams("bgt-1"));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A budget with this code already exists");
  });

  it("returns 500 when update fails", async () => {
    vi.mocked(db.budget.update).mockRejectedValue(
      new Error("Record not found")
    );

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ name: "Test" }),
    });

    const response = await PUT(request as never, makeParams("bgt-999"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Record not found");
  });
});

describe("DELETE /api/budgets/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes all transactions before deleting the budget", async () => {
    const deletedBudget = { id: "bgt-1", name: "Marketing" };
    vi.mocked(db.budgetTransaction.deleteMany).mockResolvedValue({ count: 5 } as never);
    vi.mocked(db.budget.delete).mockResolvedValue(deletedBudget as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("bgt-1"));
    const json = await response.json();

    expect(json).toEqual(deletedBudget);
    expect(db.budgetTransaction.deleteMany).toHaveBeenCalledWith({
      where: { budgetId: "bgt-1" },
    });
    expect(db.budget.delete).toHaveBeenCalledWith({
      where: { id: "bgt-1" },
    });

    // Verify transactions are deleted before the budget
    const deleteManyOrder = vi.mocked(db.budgetTransaction.deleteMany).mock.invocationCallOrder[0];
    const deleteBudgetOrder = vi.mocked(db.budget.delete).mock.invocationCallOrder[0];
    expect(deleteManyOrder).toBeLessThan(deleteBudgetOrder);
  });

  it("returns the deleted budget as JSON", async () => {
    const deletedBudget = { id: "bgt-1", name: "Marketing", code: "MKT" };
    vi.mocked(db.budgetTransaction.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.budget.delete).mockResolvedValue(deletedBudget as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("bgt-1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(deletedBudget);
  });

  it("returns 500 on error", async () => {
    vi.mocked(db.budgetTransaction.deleteMany).mockRejectedValue(
      new Error("DB connection lost")
    );

    const response = await DELETE(new Request("http://localhost") as never, makeParams("bgt-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toBe("DB connection lost");
    expect(db.budget.delete).not.toHaveBeenCalled();
  });
});
