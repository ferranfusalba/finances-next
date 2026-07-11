import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";
import { buildDateTimeFilter } from "@/lib/utils/yearFilter";
import type { TransactionLocation } from "@/types/TransactionLocation";

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

export async function recomputeAccountBalance(accountId: string) {
  const result = await db.accountTransaction.aggregate({
    where: { accountId },
    _sum: { amount: true },
  });

  await db.account.update({
    where: { id: accountId },
    data: { currentBalance: result._sum.amount ?? 0 },
  });
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

export async function getAccountTransactionBalanceBefore(
  id: string,
  beforeDate: Date,
): Promise<number> {
  const result = await db.accountTransaction.aggregate({
    where: {
      accountId: id,
      dateTime: { lt: beforeDate },
    },
    _sum: { amount: true },
  });
  return toNumber(result._sum.amount ?? new Prisma.Decimal(0));
}

export async function getAccountTransactions(
  id: string,
  year: number | null = null,
) {
  const transactions = await db.accountTransaction.findMany({
    where: {
      accountId: id,
      dateTime: buildDateTimeFilter(year),
    },
    orderBy: {
      dateTime: "asc",
    },
    include: {
      taxLines: true,
    },
  });
  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
    foreignCurrencyAmount: toNumber(t.foreignCurrencyAmount),
    foreignCurrencyExchangeRate: toNumber(t.foreignCurrencyExchangeRate),
    location: (t.location as TransactionLocation | null) ?? null,
    taxLines: t.taxLines.map((tl) => ({
      ...tl,
      rate: toNumber(tl.rate),
      amount: toNumber(tl.amount),
      taxAmount: toNumber(tl.taxAmount),
    })),
  }));
}
