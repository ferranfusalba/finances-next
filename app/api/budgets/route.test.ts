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

import { db } from "@/lib/db";
import { GET, POST } from "./route";

describe("GET /api/budgets", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns all budgets", async () => {
    vi.mocked(db.budget.findMany).mockResolvedValue([
      { id: "bgt-1", name: "Marketing" },
      { id: "bgt-2", name: "Development" },
    ] as never);

    const response = await GET();
    const json = await response.json();

    expect(json).toHaveLength(2);
    expect(db.budget.findMany).toHaveBeenCalledOnce();
  });

  it("returns empty array when no budgets", async () => {
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

  it("creates a new budget", async () => {
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
      body: JSON.stringify(budgetData),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(json.id).toBe("bgt-1");
    expect(json.name).toBe("Marketing");
    expect(db.budget.create).toHaveBeenCalledOnce();
  });

  it("returns 409 when creating budget with duplicate userId+code", async () => {
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
        userId: "user-1",
        active: true,
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("A budget with this code already exists");
  });
});
