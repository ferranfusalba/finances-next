import { db } from "@/lib/db";

export async function getBudgets(userId: string) {
  return await db.budget.findMany({
    where: {
      userId: userId,
    },
  });
}

export async function getBudget(id: string) {
  return await db.budget.findUnique({
    where: {
      id,
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
