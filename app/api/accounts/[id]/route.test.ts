import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    account: {
      findUnique: vi.fn(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    accountTransaction: {
      deleteMany: vi.fn(),
    },
  },
}));

import { db } from "@/lib/db";
import { GET, PUT, DELETE } from "./route";

const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

describe("GET /api/accounts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the account by ID", async () => {
    const account = { id: "acc-1", name: "Checking", code: "CHK", currentBalance: 150.50 };
    vi.mocked(db.account.findUnique).mockResolvedValue(account as never);

    const response = await GET(new Request("http://localhost") as never, makeParams("acc-1"));
    const json = await response.json();

    expect(json).toEqual(account);
    expect(db.account.findUnique).toHaveBeenCalledWith({ where: { id: "acc-1" } });
  });

  it("returns 404 when account not found", async () => {
    vi.mocked(db.account.findUnique).mockResolvedValue(null as never);

    const response = await GET(new Request("http://localhost") as never, makeParams("nonexistent"));
    const json = await response.json();

    expect(response.status).toBe(404);
    expect(json.error).toBe("Account not found");
  });
});

describe("PUT /api/accounts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates the account with provided data", async () => {
    vi.mocked(db.account.update).mockResolvedValue({} as never);
    const updateData = { name: "Updated Name", bankName: "New Bank" };

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify(updateData),
    });

    const response = await PUT(request as never, makeParams("acc-1"));
    const json = await response.json();

    expect(json).toBe("Updating Account acc-1");
    expect(db.account.update).toHaveBeenCalledWith({
      where: { id: "acc-1" },
      data: updateData,
    });
  });

  it("returns 409 when update causes duplicate code", async () => {
    vi.mocked(db.account.update).mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError(
        "Unique constraint failed on the fields: (`userId`,`code`)",
        { code: "P2002", clientVersion: "1" }
      )
    );

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ code: "DUPLICATE" }),
    });

    const response = await PUT(request as never, makeParams("acc-1"));
    const json = await response.json();

    expect(response.status).toBe(409);
    expect(json.error).toBe("An account with this code already exists");
  });

  it("returns 500 when update fails", async () => {
    vi.mocked(db.account.update).mockRejectedValue(
      new Error("Record not found")
    );

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ name: "Test" }),
    });

    const response = await PUT(request as never, makeParams("acc-999"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json.error).toBe("Record not found");
  });
});

describe("DELETE /api/accounts/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes all transactions before deleting the account", async () => {
    const deletedAccount = { id: "acc-1", name: "Checking" };
    vi.mocked(db.accountTransaction.deleteMany).mockResolvedValue({ count: 3 } as never);
    vi.mocked(db.account.delete).mockResolvedValue(deletedAccount as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("acc-1"));
    const json = await response.json();

    expect(json).toEqual(deletedAccount);
    expect(db.accountTransaction.deleteMany).toHaveBeenCalledWith({
      where: { accountId: "acc-1" },
    });
    expect(db.account.delete).toHaveBeenCalledWith({
      where: { id: "acc-1" },
    });

    // Verify transactions are deleted before the account
    const deleteManyOrder = vi.mocked(db.accountTransaction.deleteMany).mock.invocationCallOrder[0];
    const deleteAccountOrder = vi.mocked(db.account.delete).mock.invocationCallOrder[0];
    expect(deleteManyOrder).toBeLessThan(deleteAccountOrder);
  });

  it("returns the deleted account as JSON", async () => {
    const deletedAccount = { id: "acc-1", name: "Checking", code: "CHK" };
    vi.mocked(db.accountTransaction.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.account.delete).mockResolvedValue(deletedAccount as never);

    const response = await DELETE(new Request("http://localhost") as never, makeParams("acc-1"));
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toEqual(deletedAccount);
  });

  it("returns 500 when deleteMany throws", async () => {
    vi.mocked(db.accountTransaction.deleteMany).mockRejectedValue(
      new Error("FK constraint failed")
    );

    const response = await DELETE(new Request("http://localhost") as never, makeParams("acc-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toBe("FK constraint failed");
    expect(db.account.delete).not.toHaveBeenCalled();
  });

  it("returns 500 when account.delete throws", async () => {
    vi.mocked(db.accountTransaction.deleteMany).mockResolvedValue({ count: 0 } as never);
    vi.mocked(db.account.delete).mockRejectedValue(new Error("Record not found"));

    const response = await DELETE(new Request("http://localhost") as never, makeParams("acc-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toBe("Record not found");
  });

  it("returns 'Unknown error' for non-Error throws", async () => {
    vi.mocked(db.accountTransaction.deleteMany).mockRejectedValue("string error");

    const response = await DELETE(new Request("http://localhost") as never, makeParams("acc-1"));
    const json = await response.json();

    expect(response.status).toBe(500);
    expect(json).toBe("Unknown error");
  });
});
