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

const mockUser = { id: "user-1", name: "John", email: "john@example.com" };

describe("GET /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns accounts for the current user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
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
});

describe("POST /api/accounts", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const request = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ name: "Test" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    expect(db.account.create).not.toHaveBeenCalled();
  });

  it("creates a new account with userId from session", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

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
      body: JSON.stringify({
        bankName: "Test Bank",
        name: "Checking",
        code: "CHK",
        type: "CHECKING",
        defaultCurrency: "USD",
        country: "US",
        currentBalance: 0,
        active: true,
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(json.id).toBe("acc-1");
    expect(db.account.create).toHaveBeenCalledOnce();

    // Verify userId comes from session, not request body
    const createCall = vi.mocked(db.account.create).mock.calls[0][0];
    expect(createCall.data.userId).toBe("user-1");
  });

  it("returns 400 when body fails validation", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const request = new Request("http://localhost/api/accounts", {
      method: "POST",
      body: JSON.stringify({ name: "" }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(400);
    expect(json.error).toBeDefined();
  });

  it("returns 409 when creating account with duplicate code", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
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
        active: true,
      }),
    });

    const response = await POST(request as never);
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("An account with this code already exists");
  });
});
