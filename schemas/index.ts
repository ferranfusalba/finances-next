import * as z from "zod";

import { ACCOUNT_TYPES } from "@/lib/utils/account";
import { TRANSACTION_TYPES } from "@/lib/utils/transaction";

// Re-exported so existing importers keep working. The constants live in
// lib/utils/account so lib/utils/transaction can key its allowed-types table on
// them without importing this module back — schemas already imports from there.
export { ACCOUNT_TYPES };
export type { AccountTypeValue } from "@/lib/utils/account";

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

// `currentBalance` is deliberately absent: it is derived, not supplied. It is a
// denormalized SUM(amount) over the account's transactions (recomputeAccountBalance),
// so letting a client set it would let the two disagree. The starting balance
// arrives as openingBalance and is written as the account's OPENING transaction —
// the first row of the ledger — which keeps SUM(amount) correct by construction.
export const CreateAccountSchema = z.object({
  name: z.string().min(1),
  code: z.string().min(1),
  bankName: z.string().default(""),
  active: z.boolean(),
  type: AccountTypeSchema,
  description: z.string().nullable().optional(),
  defaultCurrency: z.string().default(""),
  number: z.string().nullable().optional(),
  country: z.string().default(""),
  openingBalance: z.number(),
  openingDate: z.string().or(z.date()),
  // The zone the opening's wall clock was written in. Stored on the row so the
  // ledger can render it back in the account's own time rather than the
  // browser's — an opening dated 31 December must read 31 December from anywhere.
  openingTimezoneId: z.string().optional(),
  // The INVESTMENT_CASH leg hangs off its INVESTMENT parent. The route verifies
  // the parent exists, belongs to the caller, and is of the right type.
  parentAccountId: z.string().nullable().optional(),
  // Creates the cash leg alongside an INVESTMENT account, in the same write.
  //
  // An investment provider holds two balances, so asking for one and making you
  // add the other afterwards means entering the total as the invested figure,
  // discovering the header sums both legs, and going back to subtract. Ask for
  // both up front, or for neither.
  cashOpeningBalance: z.number().nullable().optional(),
});

// `type` is deliberately absent: an account's type is immutable. It decides
// which transaction types the account may hold, so changing it would orphan
// rows that are already there (flipping INVESTMENT -> CHECKING would strand its
// RETURN rows). Zod strips the key, so a client that still sends one is ignored
// rather than rejected. A wrong type means opening a new account.
export const UpdateAccountSchema = z.object({
  name: z.string().min(1).optional(),
  code: z.string().min(1).optional(),
  bankName: z.string().optional(),
  active: z.boolean().optional(),
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

