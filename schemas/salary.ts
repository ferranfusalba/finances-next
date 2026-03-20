import { z } from "zod";

export const SalaryLineSchema = z.object({
  id: z.string().optional(),
  concept: z.string().min(1, "Concept is required"),
  group: z.string().min(1, "Group is required"),
  amount: z.number(),
  order: z.number().int().default(0),
});

export const SalaryPaymentSchema = z.object({
  id: z.string().optional(),
  transactionId: z.string().min(1, "Transaction is required"),
  concept: z.string().default(""),
});

export const CreateSalarySchema = z.object({
  month: z.coerce.date(),
  employer: z.string().min(1, "Employer is required"),
  grossPay: z.number(),
  currency: z.string().min(3, "Currency is required"),
  notes: z.string().default(""),
  lines: z.array(SalaryLineSchema).default([]),
  payments: z.array(SalaryPaymentSchema).default([]),
});

export const UpdateSalarySchema = CreateSalarySchema.partial();
