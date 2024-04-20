import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function getBudgets(userId: string) {
  return await db.budget.findMany({
    where: {
      userId: userId,
    },
  });
}

export async function getBudget({ params }: AccountBudgetParamsProps) {
  return await db.budget.findUnique({
    where: {
      id: params.id,
    },
  });
}

export async function getBudgetTransactions(id: string) {
  return await db.budgetTransaction.findMany({
    where: {
      budgetId: id,
    },
  });
}
