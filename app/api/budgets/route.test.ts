import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    budget: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { GET, POST } from "./route";

const mockUser = { id: "user-1", name: "John", email: "john@example.com" };

describe("GET /api/budgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns budgets filtered by current user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.budget.findMany).mockResolvedValue([
      { id: "bgt-1", name: "Marketing" },
      { id: "bgt-2", name: "Development" },
    ] as never);

    const response = await GET();
    const json = await response.json();

    expect(json).toHaveLength(2);
    expect(db.budget.findMany).toHaveBeenCalledWith({
      where: { userId: "user-1" },
    });
  });

  it("returns empty array when no budgets", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.budget.findMany).mockResolvedValue([] as never);

    const response = await GET();
    const json = await response.json();

    expect(json).toHaveLength(0);
  });
});

describe("POST /api/budgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const request = new Request("http://localhost/api/budgets", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    expect(db.budget.create).not.toHaveBeenCalled();
  });

  it("creates a new budget with userId from session", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const budgetData = {
      id: "bgt-1",
      name: "Marketing",
      code: "MKT",
      type: "MONTHLY",
      defaultCurrency: "USD",
      initialBalance: 1000,
      userId: "user-1",
      active: true,
    };

    vi.mocked(db.budget.create).mockResolvedValue(budgetData as never);

    const request = new Request("http://localhost/api/budgets", {
      method: "POST",
      body: JSON.stringify({
        name: "Marketing",
        code: "MKT",
        type: "MONTHLY",
        defaultCurrency: "USD",
        initialBalance: 1000,
        active: true,
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(json.id).toBe("bgt-1");
    expect(json.name).toBe("Marketing");
    expect(db.budget.create).toHaveBeenCalledOnce();

    // Verify userId comes from session, not request body
    const createCall = vi.mocked(db.budget.create).mock.calls[0][0];
    expect(createCall.data.userId).toBe("user-1");
  });

  it("returns 400 when body fails validation", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const request = new Request("http://localhost/api/budgets", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(db.budget.create).not.toHaveBeenCalled();
  });

  it("returns 409 when creating budget with duplicate code", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.budget.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`userId`,`code`)",
        { code: "P2002", clientVersion: "1" }
      )
    );

    const request = new Request("http://localhost/api/budgets", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate",
        code: "MKT",
        type: "MONTHLY",
        initialBalance: 0,
        active: true,
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A budget with this code already exists");
  });
});
