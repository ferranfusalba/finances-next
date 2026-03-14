"use client";

import { createContext, useContext, type ReactNode } from "react";
import type { Decimal } from "@prisma/client/runtime/library";
import { Account } from "@/types/Account";
import type { TransactionLocation } from "@/types/TransactionLocation";

interface TransactionUserContextValue {
  userId: string;
  userLocale: string;
  userTimezone: string;
  userAccounts: Array<Account>;
  userTransactionPayees: Array<{
    id: string | null;
    userId: string | null;
    name: string | null;
  }>;
  userTransactionCategories: Array<{
    id: string | null;
    userId: string | null;
    name: string | null;
    defaultTaxRate: Decimal | number | string | null;
    recurring: string | null;
    subcategories: Array<{
      categoryId: string | null;
      id: string | null;
      name: string | null;
      userId: string | null;
      defaultTaxRate?: Decimal | number | string | null;
      recurring?: string | null;
    }>;
  }>;
  userDefaultTaxRate: number;
  userForeignCurrencies: string[];
  userTransactionLocations: TransactionLocation[];
  userTransactionTags: string[];
  hasTransactions: boolean;
}

const TransactionUserContext =
  createContext<TransactionUserContextValue | null>(null);

export function TransactionUserProvider({
  children,
  value,
}: {
  children: ReactNode;
  value: TransactionUserContextValue;
}) {
  return (
    <TransactionUserContext.Provider value={value}>
      {children}
    </TransactionUserContext.Provider>
  );
}

export function useTransactionUser(): TransactionUserContextValue {
  const ctx = useContext(TransactionUserContext);
  if (!ctx) {
    throw new Error(
      "useTransactionUser must be used within a TransactionUserProvider",
    );
  }
  return ctx;
}

export type { TransactionUserContextValue };
