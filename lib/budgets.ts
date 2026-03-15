import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { buildDateTimeFilter } from "@/lib/utils/yearFilter";
import type { TransactionLocation } from "@/types/TransactionLocation";

export async function getBudgets(userId: string) {
  const budgets = await db.budget.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      order: "asc",
    },
  });
  return budgets.map((b) => ({
    ...b,
    initialBalance: toNumber(b.initialBalance),
    currentBalance: toNumber(b.currentBalance),
  }));
}

export async function getBudget(id: string) {
  const budget = await db.budget.findUnique({
    where: {
      id,
    },
  });
  if (!budget) return null;
  return {
    ...budget,
    initialBalance: toNumber(budget.initialBalance),
    currentBalance: toNumber(budget.currentBalance),
  };
}

export async function getBudgetTransactions(
  id: string,
  year: number | null = null,
) {
  const transactions = await db.budgetTransaction.findMany({
    where: {
      budgetId: id,
      dateTime: buildDateTimeFilter(year),
    },
    orderBy: {
      dateTime: "asc",
    },
  });
  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
    balance: toNumber(t.balance),
    foreignCurrencyAmount: toNumber(t.foreignCurrencyAmount),
    foreignCurrencyExchangeRate: toNumber(t.foreignCurrencyExchangeRate),
    location: (t.location as TransactionLocation | null) ?? null,
  }));
}
