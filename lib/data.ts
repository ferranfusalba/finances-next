import { Prisma } from "@prisma/client";

import { db } from "@/lib/db";
import { toNumber } from "@/lib/utils";

export async function getRecurringPayments(userId: string) {
  const transactions = await db.accountTransaction.findMany({
    where: {
      Account: { userId },
      NOT: { recurring: null },
    },
    orderBy: {
      dateTime: "asc",
    },
    select: {
      id: true,
      dateTime: true,
      payee: true,
      concept: true,
      accountId: true,
      amount: true,
      currency: true,
      recurring: true,
    },
  });

  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
  }));
}

export async function getSalesTaxTransactions(userId: string) {
  const transactions = await db.accountTransaction.findMany({
    where: {
      Account: { userId },
      taxLines: { some: {} },
    },
    orderBy: {
      dateTime: "asc",
    },
    select: {
      id: true,
      dateTime: true,
      payee: true,
      concept: true,
      accountId: true,
      amount: true,
      currency: true,
      taxLines: {
        select: {
          rate: true,
          amount: true,
          inclusive: true,
          taxAmount: true,
        },
      },
    },
  });

  return transactions.map((t) => ({
    ...t,
    amount: toNumber(t.amount),
    taxLines: t.taxLines.map((tl) => ({
      rate: toNumber(tl.rate),
      amount: toNumber(tl.amount),
      inclusive: tl.inclusive,
      taxAmount: toNumber(tl.taxAmount),
    })),
    totalTax: toNumber(
      t.taxLines.reduce(
        (sum, tl) => sum.add(tl.taxAmount),
        new Prisma.Decimal(0),
      ),
    ),
  }));
}
