import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

export async function getAccounts(userId: string) {
  const accounts = await db.account.findMany({
    where: {
      userId: userId,
    },
    orderBy: {
      order: "asc",
    },
  });
  return accounts.map((a) => ({
    ...a,
    currentBalance: toNumber(a.currentBalance),
  }));
}

export async function getAccount(id: string) {
  const account = await db.account.findUnique({
    where: {
      id,
    },
  });
  if (!account) return null;
  return {
    ...account,
    currentBalance: toNumber(account.currentBalance),
  };
}

export async function getAccountTransactions(id: string) {
  const transactions = await db.accountTransaction.findMany({
    where: {
      accountId: id,
    },
    orderBy: {
      dateTime: "asc",
    },
  });
  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
    foreignCurrencyAmount: toNumber(t.foreignCurrencyAmount),
    foreignCurrencyExchangeRate: toNumber(t.foreignCurrencyExchangeRate),
  }));
}
