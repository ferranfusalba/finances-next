import { describe, expect, it, vi, beforeEach } from "vitest";
import { Prisma } from "@prisma/client";

vi.mock("@/lib/db", () => ({
  db: {
    salary: {
      findMany: vi.fn(),
      create: vi.fn(),
    },
    accountTransaction: {
      findMany: vi.fn(),
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

describe("GET /api/salaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const response = await GET();

    expect(response.status).toBe(401);
  });

  it("returns salaries with Decimal fields converted to numbers", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findMany).mockResolvedValue([makeSalary()] as never);

    const response = await GET();
    const json = await response.json();

    expect(response.status).toBe(200);
    expect(json).toHaveLength(1);
    expect(json[0].grossPay).toBe(3000);
    expect(json[0].lines[0].amount).toBe(450);
    expect(json[0].payments[0].transaction.amount).toBe(2550);
  });

  it("returns empty array when no salaries exist", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.findMany).mockResolvedValue([] as never);

    const response = await GET();
    const json = await response.json();

    expect(json).toEqual([]);
  });
});

describe("POST /api/salaries", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns 401 when not authenticated", async () => {
    vi.mocked(currentUser).mockResolvedValue(undefined as never);

    const request = new Request("http://localhost/api/salaries", {
      method: "POST",
      body: JSON.stringify({
        month: "2026-01-01",
        employer: "Acme",
        grossPay: 3000,
        currency: "EUR",
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(401);
    expect(db.salary.create).not.toHaveBeenCalled();
  });

  it("returns 400 when body fails validation", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);

    const request = new Request("http://localhost/api/salaries", {
      method: "POST",
      body: JSON.stringify({ month: "2026-01-01" }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(400);
  });

  it("creates a salary with lines and payments", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([
      { id: "tx-1" },
    ] as never);
    vi.mocked(db.salary.create).mockResolvedValue(makeSalary() as never);

    const request = new Request("http://localhost/api/salaries", {
      method: "POST",
      body: JSON.stringify({
        month: "2026-01-01",
        employer: "Acme Corp",
        grossPay: 3000,
        currency: "EUR",
        lines: [
          { concept: "IRPF", group: "Income Tax", amount: 450, order: 0 },
        ],
        payments: [{ transactionId: "tx-1", concept: "" }],
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(db.salary.create).toHaveBeenCalledOnce();

    const createCall = vi.mocked(db.salary.create).mock.calls[0][0];
    expect(createCall.data.userId).toBe("user-1");
    expect(createCall.data.employer).toBe("Acme Corp");
    expect(createCall.data.grossPay).toBe(3000);
    expect(createCall.data.lines!.create).toHaveLength(1);
    expect(createCall.data.payments!.create).toHaveLength(1);
  });

  it("returns 403 when linking transactions not owned by user", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    // Return empty — user doesn't own the transaction
    vi.mocked(db.accountTransaction.findMany).mockResolvedValue([] as never);

    const request = new Request("http://localhost/api/salaries", {
      method: "POST",
      body: JSON.stringify({
        month: "2026-01-01",
        employer: "Acme Corp",
        grossPay: 3000,
        currency: "EUR",
        payments: [{ transactionId: "tx-other", concept: "" }],
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(403);
    expect(db.salary.create).not.toHaveBeenCalled();
  });

  it("creates a salary without lines or payments", async () => {
    vi.mocked(currentUser).mockResolvedValue(mockUser as never);
    vi.mocked(db.salary.create).mockResolvedValue(
      makeSalary({ lines: [], payments: [] }) as never,
    );

    const request = new Request("http://localhost/api/salaries", {
      method: "POST",
      body: JSON.stringify({
        month: "2026-01-01",
        employer: "Acme Corp",
        grossPay: 3000,
        currency: "EUR",
      }),
    });

    const response = await POST(request as never);

    expect(response.status).toBe(200);
    expect(db.salary.create).toHaveBeenCalledOnce();
  });
});
