import { db } from "@/lib/db";

import { AccountBudgetParamsProps } from "@/types/AccountBudget";

export async function getAccounts(userId: string) {
  return await db.account.findMany({
    where: {
      userId: userId,
    },
  });
}

export async function getAccount({ params }: AccountBudgetParamsProps) {
  return await db.account.findUnique({
    where: {
      id: params.id,
    },
  });
}

export async function getAccountTransactions(id: string) {
  return await db.accountTransaction.findMany({
    where: {
      accountId: id,
    },
  });
}
