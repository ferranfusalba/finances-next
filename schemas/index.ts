import * as z from "zod";

import { TRANSACTION_TYPES } from "@/lib/utils/transaction";

export const ACCOUNT_TYPES = [
  "CHECKING",
  "SAVINGS",
  "CASH",
  "PREPAID",
  "INVESTMENT",
] as const;

export type AccountTypeValue = (typeof ACCOUNT_TYPES)[number];

export const AccountTypeSchema = z.enum(ACCOUNT_TYPES);

// Reject unknown types outright. Previously `z.string().min(1)`, which let
// `type: "BANANA"` persist and be treated as INCOME by the sign fallthrough.
export const TransactionTypeSchema = z.enum(
  TRANSACTION_TYPES as [string, ...string[]],
);

export const SettingsSchema = z
  .object({
    name: z.optional(z.string()),
    email: z.optional(z.string().email()),
    password: z.optional(z.string().min(6)),
    newPassword: z.optional(z.string().min(6)),
    userCountry: z.string(),
    userCurrency: z.string(),
    userTimezone: z.string(),
    userLocale: z.string(),
    weekStartsOn: z.coerce.number().min(0).max(6),
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
  code: z.optional(z.string()),
});

export const TwoFactorSetupSchema = z.object({
  code: z.string().length(6, { message: "Code must be 6 digits" }),
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
  userTimezone: z.optional(z.string()),
  userLocale: z.optional(z.string()),
});

// --- Shared Sub-Schemas ---

const TransactionLocationSchema = z.object({
  name: z.string(),
  address: z.string(),
  lat: z.number(),
  lng: z.number(),
  placeId: z.string(),
});

// --- API Route Schemas ---

export const CreateAccountSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  bankName: z.string().default(""),
  active: z.boolean(),
  type: AccountTypeSchema,
  description: z.string().nullable().optional(),
  defaultCurrency: z.string().default(""),
  currentBalance: z.number().default(0),
  number: z.string().nullable().optional(),
  country: z.string().default(""),
});

export const UpdateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  bankName: z.string().optional(),
  active: z.boolean().optional(),
  type: AccountTypeSchema.optional(),
  description: z.string().nullable().optional(),
  defaultCurrency: z.string().optional(),
  currentBalance: z.number().optional(),
  number: z.string().nullable().optional(),
  country: z.string().optional(),
  order: z.number().optional(),
});

export const CreateAccountTransactionSchema = z.object({
  payee: z.string().default(""),
  concept: z.string().default(""),
  recurring: z.string().nullable().optional(),
  type: TransactionTypeSchema,
  typeTransferOrigin: z.string().nullable().optional(),
  typeTransferDestination: z.string().nullable().optional(),
  currency: z.string().min(1),
  amount: z.number(),
  foreignCurrency: z.string().nullable().optional(),
  foreignCurrencyAmount: z.number().nullable().optional(),
  foreignCurrencyExchangeRate: z.number().nullable().optional(),
  category: z.string().default(""),
  subcategory: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  dateTime: z.string().or(z.date()),
  timezoneId: z.string().nullable().optional(),
  timezoneOffset: z.string().nullable().optional(),
  location: TransactionLocationSchema.nullable().optional(),
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
  recurring: z.string().nullable().optional(),
  type: TransactionTypeSchema.optional(),
  typeTransferOrigin: z.string().nullable().optional(),
  typeTransferDestination: z.string().nullable().optional(),
  currency: z.string().min(1).optional(),
  amount: z.number().optional(),
  foreignCurrency: z.string().nullable().optional(),
  foreignCurrencyAmount: z.number().nullable().optional(),
  foreignCurrencyExchangeRate: z.number().nullable().optional(),
  category: z.string().optional(),
  subcategory: z.string().nullable().optional(),
  tags: z.array(z.string()).optional(),
  dateTime: z.string().or(z.date()).optional(),
  timezoneId: z.string().nullable().optional(),
  timezoneOffset: z.string().nullable().optional(),
  location: TransactionLocationSchema.nullable().optional(),
  notes: z.string().optional(),
  taxLines: z.array(z.object({
    rate: z.number(),
    amount: z.number(),
    inclusive: z.boolean(),
    taxAmount: z.number(),
  })).nullable().optional(),
  accountId: z.string().min(1).optional(),
});

