import { describe, expect, it } from "vitest";
import { CreateSalarySchema, UpdateSalarySchema } from "./salary";

describe("CreateSalarySchema", () => {
  it("validates a minimal salary", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-01-01",
      employer: "Acme Corp",
      grossPay: 3000,
      currency: "EUR",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.employer).toBe("Acme Corp");
      expect(result.data.grossPay).toBe(3000);
      expect(result.data.lines).toEqual([]);
      expect(result.data.payments).toEqual([]);
    }
  });

  it("validates a salary with lines and payments", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-01-01",
      employer: "Acme Corp",
      grossPay: 3000,
      currency: "EUR",
      notes: "January salary",
      lines: [
        { concept: "IRPF", group: "Income Tax", amount: 450, order: 0 },
        { concept: "SS", group: "Social Security", amount: 200, order: 1 },
      ],
      payments: [
        { transactionId: "tx-1", concept: "Main account" },
      ],
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.lines).toHaveLength(2);
      expect(result.data.payments).toHaveLength(1);
    }
  });

  it("rejects when employer is empty", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-01-01",
      employer: "",
      grossPay: 3000,
      currency: "EUR",
    });

    expect(result.success).toBe(false);
  });

  it("rejects when currency is too short", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-01-01",
      employer: "Acme",
      grossPay: 3000,
      currency: "EU",
    });

    expect(result.success).toBe(false);
  });

  it("rejects a line with empty concept", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-01-01",
      employer: "Acme",
      grossPay: 3000,
      currency: "EUR",
      lines: [{ concept: "", group: "Tax", amount: 100 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a line with empty group", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-01-01",
      employer: "Acme",
      grossPay: 3000,
      currency: "EUR",
      lines: [{ concept: "IRPF", group: "", amount: 100 }],
    });

    expect(result.success).toBe(false);
  });

  it("rejects a payment with empty transactionId", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-01-01",
      employer: "Acme",
      grossPay: 3000,
      currency: "EUR",
      payments: [{ transactionId: "", concept: "" }],
    });

    expect(result.success).toBe(false);
  });

  it("coerces month string to Date", () => {
    const result = CreateSalarySchema.safeParse({
      month: "2026-03-01T00:00:00.000Z",
      employer: "Acme",
      grossPay: 3000,
      currency: "EUR",
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.month).toBeInstanceOf(Date);
    }
  });
});

describe("UpdateSalarySchema", () => {
  it("allows partial updates", () => {
    const result = UpdateSalarySchema.safeParse({
      grossPay: 3500,
    });

    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.grossPay).toBe(3500);
      expect(result.data.employer).toBeUndefined();
    }
  });

  it("allows an empty object", () => {
    const result = UpdateSalarySchema.safeParse({});

    expect(result.success).toBe(true);
  });
});
