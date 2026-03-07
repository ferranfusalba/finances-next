import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    userTransactionCategory: {
      upsert: vi.fn(),
    },
    userTransactionSubcategory: {
      upsert: vi.fn(),
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
