import { UserRole } from "@prisma/client";
import * as z from "zod";

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    role: z.enum([UserRole.ADMIN, UserRole.USER]),
    email: z.optional(z.string().email()),
    password: z.optional(z.string().min(6)),
    newPassword: z.optional(z.string().min(6)),
    userCountry: z.string(),
    userCurrency: z.string(),
    userTimezone: z.string(),
    userLocale: z.string(),
  })
  .refine(
    (data) => {
      if (data.password && !data.newPassword) {
        return false;
      }

      if (data.newPassword && !data.password) {
        return false;
      }

      return true;
    },
    {
      message: "New password is required",
      path: ["newPassword"],
    }
  )
  .refine(
    (data) => {
      if (data.newPassword && !data.password) {
        return false;
      }

      return true;
    },
    {
      message: "Password is required",
      path: ["password"],
    }
  );

export const NewPasswordSchema = z.object({
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
});

export const ResetSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
});

export const LoginSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(1, {
    message: "Password is required",
  }),
});

export const RegisterSchema = z.object({
  email: z.string().email({
    message: "Email is required",
  }),
  password: z.string().min(6, {
    message: "Minimum 6 characters required",
  }),
  name: z.string().min(1, {
    message: "Name is required",
  }),
});

// --- API Route Schemas ---

export const CreateAccountSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  bankName: z.string().default(""),
  active: z.boolean(),
  type: z.string().min(1),
  description: z.string().nullable().optional(),
  defaultCurrency: z.string().default(""),
  currentBalance: z.number().default(0),
  number: z.string().nullable().optional(),
  country: z.string().default(""),
  userId: z.string().optional(),
});

export const UpdateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  bankName: z.string().optional(),
  active: z.boolean().optional(),
  type: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  defaultCurrency: z.string().optional(),
  currentBalance: z.number().optional(),
  number: z.string().nullable().optional(),
  country: z.string().optional(),
  order: z.number().optional(),
});

export const CreateBudgetSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  active: z.boolean(),
  type: z.string().min(1),
  description: z.string().nullable().optional(),
  defaultCurrency: z.string().default(""),
  initialBalance: z.number(),
  userId: z.string().optional(),
});

export const UpdateBudgetSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  active: z.boolean().optional(),
  type: z.string().min(1).optional(),
  description: z.string().nullable().optional(),
  defaultCurrency: z.string().optional(),
  initialBalance: z.number().optional(),
  currentBalance: z.number().optional(),
  order: z.number().optional(),
});

export const CreateAccountTransactionSchema = z.object({
  payee: z.string().default(""),
  concept: z.string().default(""),
  type: z.string().min(1),
  typeTransferOrigin: z.string().nullable().optional(),
  typeTransferDestination: z.string().nullable().optional(),
  currency: z.string().min(1),
  amount: z.number(),
  foreignCurrency: z.string().nullable().optional(),
  foreignCurrencyAmount: z.number().nullable().optional(),
  foreignCurrencyExchangeRate: z.number().nullable().optional(),
  category: z.string().default(""),
  subcategory: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  dateTime: z.string().or(z.date()),
  timezone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string(),
  taxLines: z.array(z.object({
    rate: z.number(),
    amount: z.number(),
    inclusive: z.boolean(),
    taxAmount: z.number(),
  })).nullable().optional(),
  accountId: z.string().min(1),
});

export const UpdateAccountTransactionSchema = z.object({
  payee: z.string().optional(),
  concept: z.string().optional(),
  type: z.string().min(1).optional(),
  typeTransferOrigin: z.string().nullable().optional(),
  typeTransferDestination: z.string().nullable().optional(),
  currency: z.string().min(1).optional(),
  amount: z.number().optional(),
  foreignCurrency: z.string().nullable().optional(),
  foreignCurrencyAmount: z.number().nullable().optional(),
  foreignCurrencyExchangeRate: z.number().nullable().optional(),
  category: z.string().optional(),
  subcategory: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  dateTime: z.string().or(z.date()).optional(),
  timezone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string().optional(),
  taxLines: z.array(z.object({
    rate: z.number(),
    amount: z.number(),
    inclusive: z.boolean(),
    taxAmount: z.number(),
  })).nullable().optional(),
  accountId: z.string().min(1).optional(),
});

export const CreateBudgetTransactionSchema = z.object({
  concept: z.string().default(""),
  type: z.string().min(1),
  currency: z.string().min(1),
  amount: z.number(),
  foreignCurrency: z.string().nullable().optional(),
  foreignCurrencyAmount: z.number().nullable().optional(),
  foreignCurrencyExchangeRate: z.number().nullable().optional(),
  category: z.string().default(""),
  subcategory: z.string().nullable().optional(),
  tags: z.string().nullable().optional(),
  dateTime: z.string().or(z.date()),
  timezone: z.string().nullable().optional(),
  location: z.string().nullable().optional(),
  notes: z.string(),
  budgetId: z.string().min(1),
});
