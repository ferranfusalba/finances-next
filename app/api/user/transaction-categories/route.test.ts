import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    userTransactionCategory: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
    userTransactionSubcategory: {
      upsert: vi.fn(),
      findFirst: vi.fn(),
      update: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { POST, PATCH } from "./route";

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

    const response = await POST(makeRequest({ name: "Food" }));

    expect(response.status).toBe(401);
  });

  it("returns 400 when name is empty", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(makeRequest({ name: "" }));

    expect(response.status).toBe(400);
    expect(db.userTransactionCategory.upsert).not.toHaveBeenCalled();
  });

  it("upserts category without subcategory", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.upsert).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
    } as never);

    const response = await POST(makeRequest({ name: "Food" }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.name).toBe("Food");
    expect(db.userTransactionCategory.upsert).toHaveBeenCalledWith({
      where: { userId_name: { userId: "user-1", name: "Food" } },
      update: {},
      create: { userId: "user-1", name: "Food" },
    });
    expect(db.userTransactionSubcategory.upsert).not.toHaveBeenCalled();
  });

  it("upserts category and subcategory together", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.upsert).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Food",
    } as never);
    vi.mocked(db.userTransactionSubcategory.upsert).mockResolvedValue({
      id: "sub-1",
      userId: "user-1",
      name: "Groceries",
      categoryId: "cat-1",
    } as never);

    const response = await POST(
      makeRequest({ name: "Food", subcategory: "Groceries" }),
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
    } as never);

    await POST(makeRequest({ name: "Food", subcategory: "" }));

    expect(db.userTransactionSubcategory.upsert).not.toHaveBeenCalled();
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

  it("updates recurring frequency on a category", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionCategory.findFirst).mockResolvedValue({
      id: "cat-1",
      userId: "user-1",
      name: "Digital Subscriptions",
    } as never);
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

  it("updates recurring on a subcategory", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionSubcategory.findFirst).mockResolvedValue({
      id: "sub-1",
      categoryId: "cat-1",
      name: "WSJ",
    } as never);
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
  });

  it("returns 404 when subcategory not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.userTransactionSubcategory.findFirst).mockResolvedValue(null as never);

    const response = await PATCH(
      makePatchRequest({ subcategoryId: "sub-999", recurring: "MONTHLY" }),
    );

    expect(response.status).toBe(404);
  });
});
