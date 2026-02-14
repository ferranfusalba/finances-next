import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    account: {
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

describe("GET /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns accounts for the current user", async () => {
    vi.mocked(currentUser).mockResolvedValue({
      id: "user-1",
      name: "John",
      email: "john@example.com",
    } as never);
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

  it("queries with undefined userId when no user session", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);
    vi.mocked(db.account.findMany).mockResolvedValue([] as never);

    const response = await GET();
    const json = await response.json();

    expect(json).toHaveLength(0);
    expect(db.account.findMany).toHaveBeenCalledWith({
      where: { userId: undefined },
    });
  });
});

describe("POST /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates a new account", async () => {
    const accountData = {
      id: "acc-1",
      bankName: "Test Bank",
      name: "Checking",
      code: "CHK",
      type: "CHECKING",
      defaultCurrency: "USD",
      country: "US",
      currentBalance: 0,
      userId: "user-1",
      active: true,
    };

    vi.mocked(db.account.create).mockResolvedValue(accountData as never);

    const request = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify(accountData),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(json.id).toBe("acc-1");
    expect(json.bankName).toBe("Test Bank");
    expect(db.account.create).toHaveBeenCalledOnce();
  });

  it("returns 409 when creating account with duplicate userId+code", async () => {
    vi.mocked(db.account.create).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`userId`,`code`)",
        { code: "P2002", clientVersion: "1" }
      )
    );

    const request = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({
        name: "Duplicate",
        code: "CHK",
        type: "CHECKING",
        userId: "user-1",
        active: true,
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("An account with this code already exists");
  });
});
