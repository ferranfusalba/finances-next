import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    userTransactionCategory: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    userTransactionSubcategory: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      findMany: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
      deleteMany: vi.fn(),
    },
    accountTransaction: {
      updateMany: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

vi.mock("@/lib/utils/categoryColors", () => ({
  getRandomCategoryColor: vi.fn(() => "4F46E5"),
}));

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { POST, PATCH, DELETE } from "./route";

const mockUser = { id: "user-1", name: "John", email: "john@example.com" };

function makeRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/user/transaction-categories", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/user/transaction-categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await POST(makeRequest({ name: "Food", type: "EXPENSE" }));

    expect(response.status).toBe(401);
  });

  it("returns 400 when name is empty", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(makeRequest({ name: "", type: "EXPENSE" }));

    expect(response.status).toBe(400);
    expect(db.userTransactionCategory.upsert).not.toHaveBeenCalled();
  });

  it("returns 400 when type is missing", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(makeRequest({ name: "Food" }));

    expect(response.status).toBe(400);
    const json = await response.json();
    expect(json.error).toContain("type");
  });

  it("returns 400 when type is invalid", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(makeRequest({ name: "Food", type: "INVALID" }));

    expect(response.status).toBe(400);
  });

  it("upserts category without subcategory", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.upsert).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
      type: "EXPENSE",
      color: "4F46E5",
    } as never);

    const response = await POST(makeRequest({ name: "Food", type: "EXPENSE" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.name).toBe("Food");
    expect(db.userTransactionCategory.upsert).toHaveBeenCalledWith({
      where: { userId_name_type: { userId: "user-1", name: "Food", type: "EXPENSE" } },
      update: {},
      create: { userId: "user-1", name: "Food", type: "EXPENSE", color: "4F46E5" },
    });
    expect(db.userTransactionSubcategory.upsert).not.toHaveBeenCalled();
  });

  it("upserts category and subcategory together", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.upsert).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
      type: "EXPENSE",
      color: "4F46E5",
    } as never);
    vi.mocked(db.userTransactionSubcategory.upsert).mockResolvedValue({
      id: "sub-1",
      userId: "user-1",
      name: "Groceries",
      categoryId: "cat-1",
    } as never);

    const response = await POST(
      makeRequest({ name: "Food", type: "EXPENSE", subcategory: "Groceries" }),
    );

    expect(response.status).toBe(200);
    expect(db.userTransactionSubcategory.upsert).toHaveBeenCalledWith({
      where: {
        categoryId_name: { categoryId: "cat-1", name: "Groceries" },
      },
      update: {},
      create: {
        userId: "user-1",
        name: "Groceries",
        categoryId: "cat-1",
      },
    });
  });

  it("does not upsert subcategory when subcategory is empty", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.upsert).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
      type: "EXPENSE",
      color: "4F46E5",
    } as never);

    await POST(makeRequest({ name: "Food", type: "EXPENSE", subcategory: "" }));

    expect(db.userTransactionSubcategory.upsert).not.toHaveBeenCalled();
  });

  it("allows same category name with different types", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.upsert).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Fees",
      type: "EXPENSE",
      color: "4F46E5",
    } as never);

    await POST(makeRequest({ name: "Fees", type: "EXPENSE" }));

    expect(db.userTransactionCategory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_name_type: { userId: "user-1", name: "Fees", type: "EXPENSE" } },
      }),
    );

    vi.mocked(db.userTransactionCategory.upsert).mockResolvedValue({
      id: "cat-2",
      userId: "user-1",
      name: "Fees",
      type: "INCOME",
      color: "4F46E5",
    } as never);

    await POST(makeRequest({ name: "Fees", type: "INCOME" }));

    expect(db.userTransactionCategory.upsert).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { userId_name_type: { userId: "user-1", name: "Fees", type: "INCOME" } },
      }),
    );
  });
});

function makePatchRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/user/transaction-categories", {
    method: "PATCH",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("PATCH /api/user/transaction-categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await PATCH(makePatchRequest({ categoryId: "cat-1", recurring: "MONTHLY" }));

    expect(response.status).toBe(401);
  });

  it("updates recurring frequency on a category and its transactions", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Digital Subscriptions",
    } as never);
    vi.mocked(db.accountTransaction.updateMany).mockResolvedValue({ count: 4 } as never);
    vi.mocked(db.userTransactionCategory.update).mockResolvedValue({
      id: "cat-1",
      name: "Digital Subscriptions",
      recurring: "MONTHLY",
      defaultTaxRate: null,
    } as never);

    const response = await PATCH(
      makePatchRequest({ categoryId: "cat-1", recurring: "MONTHLY" }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.recurring).toBe("MONTHLY");
    const updateCall = vi.mocked(db.userTransactionCategory.update).mock.calls[0][0];
    expect(updateCall.where).toEqual({ id: "cat-1" });
    expect(updateCall.data.recurring).toBe("MONTHLY");

    // Should update existing transactions
    expect(db.accountTransaction.updateMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        category: "Digital Subscriptions",
      },
      data: { recurring: "MONTHLY" },
    });
  });

  it("does not include recurring in update when not provided", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
    } as never);
    vi.mocked(db.userTransactionCategory.update).mockResolvedValue({
      id: "cat-1",
      name: "Food",
      recurring: false,
      defaultTaxRate: 10,
    } as never);

    await PATCH(
      makePatchRequest({ categoryId: "cat-1", defaultTaxRate: 10 }),
    );

    const updateCall = vi.mocked(db.userTransactionCategory.update).mock.calls[0][0];
    expect(updateCall.data).not.toHaveProperty("recurring");
  });

  it("returns 404 when category not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue(null as never);

    const response = await PATCH(
      makePatchRequest({ categoryId: "cat-999", recurring: "MONTHLY" }),
    );

    expect(response.status).toBe(404);
  });

  it("clears recurring by setting it to null", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Digital Subscriptions",
    } as never);
    vi.mocked(db.accountTransaction.updateMany).mockResolvedValue({ count: 4 } as never);
    vi.mocked(db.userTransactionCategory.update).mockResolvedValue({
      id: "cat-1",
      name: "Digital Subscriptions",
      recurring: null,
    } as never);

    const response = await PATCH(
      makePatchRequest({ categoryId: "cat-1", recurring: null }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.recurring).toBeNull();
    const updateCall = vi.mocked(db.userTransactionCategory.update).mock.calls[0][0];
    expect(updateCall.data.recurring).toBeNull();
  });

  it("updates recurring on a subcategory and its transactions", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionSubcategory.findFirst).mockResolvedValue({
      id: "sub-1",
      categoryId: "cat-1",
      name: "WSJ",
    } as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      name: "Digital Subscriptions",
    } as never);
    vi.mocked(db.accountTransaction.updateMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(db.userTransactionSubcategory.update).mockResolvedValue({
      id: "sub-1",
      name: "WSJ",
      recurring: "YEARLY",
    } as never);

    const response = await PATCH(
      makePatchRequest({ subcategoryId: "sub-1", recurring: "YEARLY" }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.recurring).toBe("YEARLY");
    const updateCall = vi.mocked(db.userTransactionSubcategory.update).mock.calls[0][0];
    expect(updateCall.data.recurring).toBe("YEARLY");

    // Should update existing transactions matching category + subcategory
    expect(db.accountTransaction.updateMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        category: "Digital Subscriptions",
        subcategory: "WSJ",
      },
      data: { recurring: "YEARLY" },
    });
  });

  it("returns 404 when subcategory not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionSubcategory.findFirst).mockResolvedValue(null as never);

    const response = await PATCH(
      makePatchRequest({ subcategoryId: "sub-999", recurring: "MONTHLY" }),
    );

    expect(response.status).toBe(404);
  });

  it("merges into existing category when moving to a type with a duplicate name", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst)
      .mockResolvedValueOnce({
        id: "cat-1",
        userId: "user-1",
        name: "Fees",
        type: "EXPENSE",
      } as never)
      .mockResolvedValueOnce({
        id: "cat-2",
        userId: "user-1",
        name: "Fees",
        type: "INCOME",
        subcategories: [{ id: "sub-t1", name: "Bank Fees" }],
      } as never);
    vi.mocked(db.accountTransaction.updateMany).mockResolvedValue({ count: 5 } as never);
    vi.mocked(db.userTransactionSubcategory.findMany).mockResolvedValue([
      { id: "sub-s1", name: "Late Fees", categoryId: "cat-1" },
      { id: "sub-s2", name: "Bank Fees", categoryId: "cat-1" },
    ] as never);
    vi.mocked(db.userTransactionSubcategory.update).mockResolvedValue({} as never);
    vi.mocked(db.userTransactionSubcategory.delete).mockResolvedValue({} as never);
    vi.mocked(db.userTransactionCategory.delete).mockResolvedValue({} as never);

    const response = await PATCH(
      makePatchRequest({ categoryId: "cat-1", type: "INCOME" }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.id).toBe("cat-2");

    // Should update transactions to the new type
    expect(db.accountTransaction.updateMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        category: "Fees",
        type: "EXPENSE",
      },
      data: { type: "INCOME" },
    });

    // Should move orphan subcategory "Late Fees" to target
    expect(db.userTransactionSubcategory.update).toHaveBeenCalledWith({
      where: { id: "sub-s1" },
      data: { categoryId: "cat-2" },
    });

    // Should delete duplicate subcategory "Bank Fees"
    expect(db.userTransactionSubcategory.delete).toHaveBeenCalledWith({
      where: { id: "sub-s2" },
    });

    // Should delete the source category
    expect(db.userTransactionCategory.delete).toHaveBeenCalledWith({
      where: { id: "cat-1" },
    });

    // Should NOT call category update (source was deleted, not updated)
    expect(db.userTransactionCategory.update).not.toHaveBeenCalled();
  });

  it("updates transaction types when changing category type", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst)
      .mockResolvedValueOnce({
        id: "cat-1",
        userId: "user-1",
        name: "Salary",
        type: "EXPENSE",
      } as never)
      .mockResolvedValueOnce(null as never);
    vi.mocked(db.accountTransaction.updateMany).mockResolvedValue({ count: 3 } as never);
    vi.mocked(db.userTransactionCategory.update).mockResolvedValue({
      id: "cat-1",
      name: "Salary",
      type: "INCOME",
    } as never);

    const response = await PATCH(
      makePatchRequest({ categoryId: "cat-1", type: "INCOME" }),
    );

    expect(response.status).toBe(200);

    // Should update EXPENSE transactions to INCOME
    expect(db.accountTransaction.updateMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        category: "Salary",
        type: "EXPENSE",
      },
      data: { type: "INCOME" },
    });

    // Should update the category itself
    const updateCall = vi.mocked(db.userTransactionCategory.update).mock.calls[0][0];
    expect(updateCall.data.type).toBe("INCOME");
  });

  it("does not update transactions when type is unchanged", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
      type: "EXPENSE",
    } as never);
    vi.mocked(db.userTransactionCategory.update).mockResolvedValue({
      id: "cat-1",
      name: "Food",
      type: "EXPENSE",
    } as never);

    await PATCH(makePatchRequest({ categoryId: "cat-1", type: "EXPENSE" }));

    expect(db.accountTransaction.updateMany).not.toHaveBeenCalled();
  });

  it("updates color on a category", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
    } as never);
    vi.mocked(db.userTransactionCategory.update).mockResolvedValue({
      id: "cat-1",
      name: "Food",
      color: "DB2777",
    } as never);

    const response = await PATCH(
      makePatchRequest({ categoryId: "cat-1", color: "DB2777" }),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.color).toBe("DB2777");
    const updateCall = vi.mocked(db.userTransactionCategory.update).mock.calls[0][0];
    expect(updateCall.data.color).toBe("DB2777");
  });
});

function makeDeleteRequest(body: Record<string, unknown>) {
  return new Request("http://localhost/api/user/transaction-categories", {
    method: "DELETE",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("DELETE /api/user/transaction-categories", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await DELETE(makeDeleteRequest({ categoryId: "cat-1" }));

    expect(response.status).toBe(401);
  });

  it("returns 400 when neither categoryId nor subcategoryId is provided", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await DELETE(makeDeleteRequest({}));

    expect(response.status).toBe(400);
  });

  it("deletes a category, clears transactions, and removes subcategories", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
      type: "EXPENSE",
    } as never);
    vi.mocked(db.accountTransaction.updateMany).mockResolvedValue({ count: 5 } as never);
    vi.mocked(db.userTransactionSubcategory.deleteMany).mockResolvedValue({ count: 2 } as never);
    vi.mocked(db.userTransactionCategory.delete).mockResolvedValue({} as never);

    const response = await DELETE(makeDeleteRequest({ categoryId: "cat-1" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.deleted).toBe(true);

    // Should clear category/subcategory on affected transactions
    expect(db.accountTransaction.updateMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        category: "Food",
      },
      data: { category: "", subcategory: null },
    });

    // Should delete subcategories before the category
    const subDeleteOrder = vi.mocked(db.userTransactionSubcategory.deleteMany).mock.invocationCallOrder[0];
    const catDeleteOrder = vi.mocked(db.userTransactionCategory.delete).mock.invocationCallOrder[0];
    expect(subDeleteOrder).toBeLessThan(catDeleteOrder);

    expect(db.userTransactionSubcategory.deleteMany).toHaveBeenCalledWith({
      where: { categoryId: "cat-1" },
    });

    expect(db.userTransactionCategory.delete).toHaveBeenCalledWith({
      where: { id: "cat-1" },
    });
  });

  it("returns 404 when category not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue(null as never);

    const response = await DELETE(makeDeleteRequest({ categoryId: "cat-999" }));

    expect(response.status).toBe(404);
  });

  it("deletes a subcategory and clears subcategory field on transactions", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionSubcategory.findFirst).mockResolvedValue({
      id: "sub-1",
      categoryId: "cat-1",
      name: "Groceries",
      category: { name: "Food" },
    } as never);
    vi.mocked(db.accountTransaction.updateMany).mockResolvedValue({ count: 3 } as never);
    vi.mocked(db.userTransactionSubcategory.delete).mockResolvedValue({} as never);

    const response = await DELETE(makeDeleteRequest({ subcategoryId: "sub-1" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.deleted).toBe(true);

    // Should clear subcategory on affected transactions
    expect(db.accountTransaction.updateMany).toHaveBeenCalledWith({
      where: {
        Account: { userId: "user-1" },
        category: "Food",
        subcategory: "Groceries",
      },
      data: { subcategory: null },
    });

    expect(db.userTransactionSubcategory.delete).toHaveBeenCalledWith({
      where: { id: "sub-1" },
    });
  });

  it("returns 404 when subcategory not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionSubcategory.findFirst).mockResolvedValue(null as never);

    const response = await DELETE(makeDeleteRequest({ subcategoryId: "sub-999" }));

    expect(response.status).toBe(404);
  });
});
