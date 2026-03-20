import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    salary: {
      findUnique: vi.fn(),
      delete: vi.fn(),
    },
    salaryLine: {
      deleteMany: vi.fn(),
    },
    salaryPayment: {
      deleteMany: vi.fn(),
    },
    accountTransaction: {
      findMany: vi.fn(),
    },
    $transaction: vi.fn(),
  },
}));

vi.mock("@/lib/auth", () => ({
  currentUser: vi.fn(),
}));

import { db } from "@/lib/db";
import { currentUser } from "@/lib/auth";
import { GET, PUT, DELETE } from "./route";

const mockUser = { id: "user-1", name: "John", email: "john@example.com" };
const makeParams = (id: string) => ({ params: Promise.resolve({ id }) });

const makeSalary = (overrides = {}) => ({
  id: "sal-1",
  userId: "user-1",
  month: new Date("2026-01-01"),
  employer: "Acme Corp",
  grossPay: new Prisma.Decimal(3000),
  currency: "EUR",
  notes: "",
  createdAt: new Date(),
  updatedAt: new Date(),
  lines: [
    {
      id: "line-1",
      salaryId: "sal-1",
      concept: "IRPF",
      group: "Income Tax",
      amount: new Prisma.Decimal(450),
      order: 0,
    },
  ],
  payments: [
    {
      id: "pay-1",
      salaryId: "sal-1",
      transactionId: "tx-1",
      concept: "",
      transaction: {
        id: "tx-1",
        amount: new Prisma.Decimal(2550),
        currency: "EUR",
        payee: "Acme Corp",
        concept: "Salary Jan",
        dateTime: new Date("2026-01-28"),
        accountId: "acc-1",
      },
    },
  ],
  ...overrides,
});

describe("GET /api/salaries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await GET(
      new Request("http://localhost") as never,
      makeParams("sal-1"),
    );

    expect(response.status).toBe(401);
  });

  it("returns the salary with Decimal fields converted to numbers", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(makeSalary() as never);

    const response = await GET(
      new Request("http://localhost") as never,
      makeParams("sal-1"),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.grossPay).toBe(3000);
    expect(json.lines[0].amount).toBe(450);
    expect(json.payments[0].transaction.amount).toBe(2550);
  });

  it("returns 404 when salary not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(null as never);

    const response = await GET(
      new Request("http://localhost") as never,
      makeParams("nonexistent"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when salary belongs to another user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(
      makeSalary({ userId: "other-user" }) as never,
    );

    const response = await GET(
      new Request("http://localhost") as never,
      makeParams("sal-1"),
    );

    expect(response.status).toBe(404);
  });
});

describe("PUT /api/salaries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ grossPay: 3500 }),
    });

    const response = await PUT(request as never, makeParams("sal-1"));

    expect(response.status).toBe(401);
  });

  it("returns 404 when salary not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(null as never);

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ grossPay: 3500 }),
    });

    const response = await PUT(request as never, makeParams("nonexistent"));

    expect(response.status).toBe(404);
  });

  it("returns 404 when salary belongs to another user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(
      { userId: "other-user" } as never,
    );

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({ grossPay: 3500 }),
    });

    const response = await PUT(request as never, makeParams("sal-1"));

    expect(response.status).toBe(404);
  });

  it("updates a salary via transaction", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(
      { userId: "user-1" } as never,
    );
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      { id: "tx-1" },
    ] as never);

    const updatedSalary = makeSalary({ grossPay: new Prisma.Decimal(3500) });
    vi.mocked(db.$transaction).mockImplementation(async (fn) => {
      const tx = {
        salaryLine: { deleteMany: vi.fn() },
        salaryPayment: { deleteMany: vi.fn() },
        salary: { update: vi.fn().mockResolvedValue(updatedSalary) },
      };
      return fn(tx as never);
    });

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({
        grossPay: 3500,
        lines: [{ concept: "IRPF", group: "Income Tax", amount: 500 }],
        payments: [{ transactionId: "tx-1", concept: "" }],
      }),
    });

    const response = await PUT(request as never, makeParams("sal-1"));

    expect(response.status).toBe(200);
    expect(db.$transaction).toHaveBeenCalledOnce();
  });

  it("returns 403 when linking transactions not owned by user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(
      { userId: "user-1" } as never,
    );
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([] as never);

    const request = new Request("http://localhost", {
      method: "PUT",
      body: JSON.stringify({
        payments: [{ transactionId: "tx-other", concept: "" }],
      }),
    });

    const response = await PUT(request as never, makeParams("sal-1"));

    expect(response.status).toBe(403);
  });
});

describe("DELETE /api/salaries/[id]", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await DELETE(
      new Request("http://localhost") as never,
      makeParams("sal-1"),
    );

    expect(response.status).toBe(401);
  });

  it("returns 404 when salary not found", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(null as never);

    const response = await DELETE(
      new Request("http://localhost") as never,
      makeParams("nonexistent"),
    );

    expect(response.status).toBe(404);
  });

  it("returns 404 when salary belongs to another user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(
      { userId: "other-user" } as never,
    );

    const response = await DELETE(
      new Request("http://localhost") as never,
      makeParams("sal-1"),
    );

    expect(response.status).toBe(404);
  });

  it("deletes the salary and returns success", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findUnique).mockResolvedValue(
      { userId: "user-1" } as never,
    );
    vi.mocked(db.salary.delete).mockResolvedValue({} as never);

    const response = await DELETE(
      new Request("http://localhost") as never,
      makeParams("sal-1"),
    );
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json.success).toBe(true);
    expect(db.salary.delete).toHaveBeenCalledWith({
      where: { id: "sal-1" },
    });
  });
});
