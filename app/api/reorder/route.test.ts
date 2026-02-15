import { describe, expect, it, vi, beforeEach } from "vitest";

vi.mock("@/lib/db", () => ({
  db: {
    account: {
      update: vi.fn(),
    },
    budget: {
      update: vi.fn(),
    },
    $transaction: vi.fn(),
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
  return new Request("http://localhost/api/reorder", {
    method: "POST",
    body: JSON.stringify(body),
  }) as never;
}

describe("POST /api/reorder", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await POST(
      makeRequest({ type: "accounts", items: [{ id: "1", order: 0 }] })
    );

    expect(response.status).toBe(401);
  });

  it("returns 400 for invalid type", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(
      makeRequest({ type: "invalid", items: [{ id: "1", order: 0 }] })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Invalid type. Must be 'accounts' or 'budgets'");
  });

  it("returns 400 when items is not an array", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(
      makeRequest({ type: "accounts", items: "not-array" })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Items must be a non-empty array");
  });

  it("returns 400 when items is empty", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const response = await POST(
      makeRequest({ type: "accounts", items: [] })
    );
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBe("Items must be a non-empty array");
  });

  it("reorders accounts scoped to user via $transaction", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.$transaction).mockResolvedValue(undefined as never);

    const items = [
      { id: "acc-1", order: 0 },
      { id: "acc-2", order: 1 },
    ];

    const response = await POST(makeRequest({ type: "accounts", items }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(db.$transaction).toHaveBeenCalledOnce();

    const transactionArg = vi.mocked(db.$transaction).mock.calls[0][0];
    expect(transactionArg).toHaveLength(2);
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1", userId: "user-1" },
      data: { order: 0 },
    });
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-2", userId: "user-1" },
      data: { order: 1 },
    });
  });

  it("reorders budgets scoped to user via $transaction", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.$transaction).mockResolvedValue(undefined as never);

    const items = [
      { id: "bgt-1", order: 0 },
      { id: "bgt-2", order: 1 },
      { id: "bgt-3", order: 2 },
    ];

    const response = await POST(makeRequest({ type: "budgets", items }));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(db.budget.update).toHaveBeenCalledTimes(3);
    expect(db.budget.update).toHaveBeenCalledWith({
      where: { id: "bgt-1", userId: "user-1" },
      data: { order: 0 },
    });
  });

  it("returns 500 when $transaction fails", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.$transaction).mockRejectedValue(
      new Error("Transaction failed")
    );

    const response = await POST(
      makeRequest({
        type: "accounts",
        items: [{ id: "acc-1", order: 0 }],
      })
    );
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Transaction failed");
  });
});
